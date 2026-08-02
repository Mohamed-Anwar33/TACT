-- Client execution projects. This migration is additive: the legacy user_id based
-- stage records remain available until the application cutover is approved.
create table if not exists public.client_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name_ar text not null,
  name_en text,
  creation_request_id uuid not null unique,
  legacy_source_user_id uuid unique references auth.users(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

alter table public.project_stages add column if not exists project_id uuid references public.client_projects(id) on delete cascade;
alter table public.project_stages alter column user_id drop not null;
create unique index if not exists project_stages_project_stage_number_key
  on public.project_stages(project_id, stage_number) where project_id is not null;
alter table public.project_stages add constraint project_stages_id_project_id_key unique (id, project_id);

alter table public.project_stage_files add column if not exists project_id uuid references public.client_projects(id) on delete cascade;
alter table public.project_stage_files add column if not exists storage_path text;
alter table public.project_stage_files add column if not exists uploaded_by uuid references auth.users(id);
alter table public.project_stage_files add column if not exists uploaded_at timestamptz not null default now();
create unique index if not exists project_stage_files_storage_path_key
  on public.project_stage_files(storage_path) where storage_path is not null;
alter table public.project_stage_files drop constraint if exists project_stage_files_stage_project_match;
alter table public.project_stage_files add constraint project_stage_files_stage_project_match
  foreign key (stage_id, project_id) references public.project_stages(id, project_id) not valid;

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.client_projects(id) on delete cascade,
  file_url text not null,
  storage_path text not null unique,
  file_name text not null,
  file_type text not null,
  category text not null default 'other',
  uploaded_by uuid not null references auth.users(id),
  uploaded_at timestamptz not null default now()
);

create table if not exists public.upload_operations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  project_id uuid not null references public.client_projects(id) on delete cascade,
  stage_id uuid references public.project_stages(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  file_type text not null,
  category text not null default 'other',
  uploaded_by uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending','storage_uploaded','completed','failed','orphaned','cleanup_failed')),
  error_message text,
  cleanup_attempts int not null default 0 check (cleanup_attempts between 0 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(uploaded_by, request_id)
);

alter table public.questionnaires add column if not exists idempotency_key uuid;
create unique index if not exists questionnaires_user_idempotency_key
  on public.questionnaires(user_id, idempotency_key) where user_id is not null and idempotency_key is not null;

alter table public.client_projects enable row level security;
alter table public.project_files enable row level security;
alter table public.upload_operations enable row level security;
alter table public.client_project_backfill_mapping enable row level security;

create policy "Customers view own client projects" on public.client_projects for select to authenticated
  using (user_id = auth.uid());
create policy "Client staff manage client projects" on public.client_projects for all to authenticated
  using (public.can_manage_clients(auth.uid())) with check (public.can_manage_clients(auth.uid()));
create policy "Customers view own project files" on public.project_files for select to authenticated
  using (exists (select 1 from public.client_projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "Client staff manage project files" on public.project_files for all to authenticated
  using (public.can_manage_clients(auth.uid())) with check (public.can_manage_clients(auth.uid()));
create policy "Client staff manage upload operations" on public.upload_operations for all to authenticated
  using (public.can_manage_clients(auth.uid())) with check (public.can_manage_clients(auth.uid()));
create policy "Client staff manage backfill mapping" on public.client_project_backfill_mapping for all to authenticated
  using (public.can_manage_clients(auth.uid())) with check (public.can_manage_clients(auth.uid()));

-- Keep execution files out of the public CMS bucket. Paths are
-- projects/stages/{project_id}/{stage_id}/{operation_id}-{file_name}.
insert into storage.buckets (id, name, public)
values ('client-project-media', 'client-project-media', false)
on conflict (id) do update set public = false;
create policy "Client project file read" on storage.objects for select to authenticated using (
  bucket_id = 'client-project-media' and exists (
    select 1 from public.client_projects p
    where p.id::text = split_part(name, '/', 3) and p.user_id = auth.uid()
  )
);
create policy "Client staff read project storage" on storage.objects for select to authenticated using (
  bucket_id = 'client-project-media' and public.can_manage_clients(auth.uid())
);
create policy "Client staff insert project storage" on storage.objects for insert to authenticated with check (
  bucket_id = 'client-project-media' and public.can_manage_clients(auth.uid())
  and exists (select 1 from public.project_stages s where s.project_id::text = split_part(name, '/', 3) and s.id::text = split_part(name, '/', 4))
);
create policy "Client staff update project storage" on storage.objects for update to authenticated using (
  bucket_id = 'client-project-media' and public.can_manage_clients(auth.uid())
) with check (bucket_id = 'client-project-media' and public.can_manage_clients(auth.uid()));
create policy "Client staff delete project storage" on storage.objects for delete to authenticated using (
  bucket_id = 'client-project-media' and public.can_manage_clients(auth.uid())
);

-- Idempotent project creation. The unique request id makes retries return the
-- original project rather than creating duplicate stages.
create or replace function public.create_client_project_with_stages(
  p_client_id uuid,
  p_name_ar text,
  p_name_en text,
  p_creation_request_id uuid
) returns public.client_projects
language plpgsql security invoker set search_path = public
as $$
declare result public.client_projects;
begin
  if not public.can_manage_clients(auth.uid()) then raise exception 'not authorized'; end if;
  select * into result from public.client_projects where creation_request_id = p_creation_request_id;
  if found then return result; end if;
  insert into public.client_projects(user_id, name_ar, name_en, creation_request_id, created_by)
  values (p_client_id, nullif(trim(p_name_ar), ''), nullif(trim(p_name_en), ''), p_creation_request_id, auth.uid())
  returning * into result;
  insert into public.project_stages(project_id, user_id, stage_number, title_ar, title_en, status)
  values
    (result.id, p_client_id, 1, 'المرحلة الأولى: التأسيسات', 'Stage 1: Foundations', 'pending'),
    (result.id, p_client_id, 2, 'المرحلة الثانية: التشطيبات الأساسية', 'Stage 2: Basic Finishes', 'pending'),
    (result.id, p_client_id, 3, 'المرحلة الثالثة: التشطيبات النهائية', 'Stage 3: Final Finishes', 'pending'),
    (result.id, p_client_id, 4, 'المرحلة الرابعة: الديكور والفرش', 'Stage 4: Decor & Furnishing', 'pending')
  on conflict (project_id, stage_number) where project_id is not null do nothing;
  return result;
end $$;

create or replace function public.create_upload_operation(
  p_request_id uuid, p_project_id uuid, p_stage_id uuid, p_storage_path text,
  p_file_name text, p_file_type text, p_category text
) returns public.upload_operations
language plpgsql security invoker set search_path = public
as $$
declare result public.upload_operations;
begin
  if not public.can_manage_clients(auth.uid()) then raise exception 'not authorized'; end if;
  if p_stage_id is not null and not exists (select 1 from project_stages where id = p_stage_id and project_id = p_project_id) then
    raise exception 'stage does not belong to project';
  end if;
  insert into upload_operations(request_id, project_id, stage_id, storage_path, file_name, file_type, category, uploaded_by)
  values (p_request_id, p_project_id, p_stage_id, p_storage_path, p_file_name, p_file_type, p_category, auth.uid())
  on conflict (uploaded_by, request_id) do update set updated_at = now()
  returning * into result;
  return result;
end $$;

create or replace function public.finalize_stage_upload(p_operation_id uuid, p_file_url text)
returns public.project_stage_files language plpgsql security invoker set search_path = public
as $$
declare op public.upload_operations; result public.project_stage_files;
begin
  select * into op from upload_operations where id = p_operation_id for update;
  if not found or not public.can_manage_clients(auth.uid()) then raise exception 'not authorized'; end if;
  if op.status = 'completed' then select * into result from project_stage_files where storage_path = op.storage_path; return result; end if;
  if op.stage_id is null then raise exception 'operation has no stage'; end if;
  update upload_operations set status = 'storage_uploaded', updated_at = now() where id = op.id;
  insert into project_stage_files(project_id, stage_id, file_url, storage_path, file_name, file_type, category, uploaded_by, uploaded_at)
  values(op.project_id, op.stage_id, p_file_url, op.storage_path, op.file_name, op.file_type, op.category, op.uploaded_by, now())
  on conflict (storage_path) do update set file_url = excluded.file_url
  returning * into result;
  update upload_operations set status = 'completed', completed_at = now(), updated_at = now() where id = op.id;
  return result;
exception when others then
  update upload_operations set status = 'orphaned', error_message = sqlerrm, updated_at = now() where id = p_operation_id;
  raise;
end $$;

-- Dry-run/report views: run these before the backfill migration is approved.
create or replace view public.client_project_backfill_dry_run
with (security_invoker = true) as
select s.user_id, count(distinct s.id) as legacy_stage_count, count(f.id) as legacy_file_count,
       bool_or(s.project_id is not null) as already_migrated
from public.project_stages s left join public.project_stage_files f on f.stage_id = s.id
where s.user_id is not null group by s.user_id;

create table if not exists public.client_project_backfill_mapping (
  legacy_stage_id uuid primary key references public.project_stages(id) on delete cascade,
  project_id uuid not null references public.client_projects(id) on delete cascade,
  migrated_at timestamptz not null default now()
);

-- Explicit, idempotent backfill. It is deliberately not called by this
-- migration; run the dry-run view, archive its report, then call this function.
create or replace function public.backfill_legacy_client_projects()
returns table(projects_created integer, stages_migrated integer, files_migrated integer)
language plpgsql security invoker set search_path = public
as $$
declare project_count integer := 0; stage_count integer := 0; file_count integer := 0;
begin
  if not public.can_manage_clients(auth.uid()) then raise exception 'not authorized'; end if;
  insert into client_projects(user_id, name_ar, name_en, creation_request_id, legacy_source_user_id, created_by)
  select distinct s.user_id, 'مشروع تاريخي', 'Legacy Project', gen_random_uuid(), s.user_id, auth.uid()
  from project_stages s
  where s.project_id is null and s.user_id is not null
    and not exists (select 1 from client_projects p where p.legacy_source_user_id = s.user_id)
  on conflict (legacy_source_user_id) do nothing;
  get diagnostics project_count = row_count;

  update project_stages s set project_id = p.id
  from client_projects p
  where s.project_id is null and s.user_id = p.legacy_source_user_id;
  get diagnostics stage_count = row_count;

  update project_stage_files f set project_id = s.project_id
  from project_stages s
  where f.stage_id = s.id and f.project_id is null;
  get diagnostics file_count = row_count;

  insert into client_project_backfill_mapping(legacy_stage_id, project_id)
  select id, project_id from project_stages where project_id is not null
  on conflict (legacy_stage_id) do nothing;

  insert into project_stages(project_id, user_id, stage_number, title_ar, title_en, status)
  select p.id, p.user_id, n.stage_number, n.title_ar, n.title_en, 'pending'
  from client_projects p
  cross join (values
    (1, 'المرحلة الأولى: التأسيسات', 'Stage 1: Foundations'),
    (2, 'المرحلة الثانية: التشطيبات الأساسية', 'Stage 2: Basic Finishes'),
    (3, 'المرحلة الثالثة: التشطيبات النهائية', 'Stage 3: Final Finishes'),
    (4, 'المرحلة الرابعة: الديكور والفرش', 'Stage 4: Decor & Furnishing')
  ) as n(stage_number, title_ar, title_en)
  where p.legacy_source_user_id is not null
  on conflict (project_id, stage_number) where project_id is not null do nothing;

  return query select project_count, stage_count, file_count;
end $$;

create or replace view public.client_project_backfill_verification
with (security_invoker = true) as
select p.id as project_id, p.user_id, count(distinct s.id) filter (where s.stage_number between 1 and 4) as stage_count,
       count(distinct f.id) filter (where f.project_id <> s.project_id or f.project_id is null) as mismatched_file_count
from client_projects p
left join project_stages s on s.project_id = p.id
left join project_stage_files f on f.stage_id = s.id
group by p.id, p.user_id;
