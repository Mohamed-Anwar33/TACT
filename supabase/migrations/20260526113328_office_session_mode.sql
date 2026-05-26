alter type public.app_role add value if not exists 'office_consultant';

alter table public.configurator_selections
  add column if not exists questionnaire_id uuid references public.questionnaires(id) on delete set null,
  add column if not exists client_name text,
  add column if not exists client_phone text,
  add column if not exists client_email text;

create index if not exists configurator_selections_questionnaire_id_idx
  on public.configurator_selections(questionnaire_id);

create or replace function public.is_office_consultant(_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and role::text = 'office_consultant'
  )
$$;

create or replace function public.has_package_access(_user_id uuid, _package_id text)
returns boolean language sql stable security definer set search_path = public
as $$
  select
    public.is_office_consultant(_user_id)
    or exists (
      select 1
      from public.package_unlocks
      where user_id = _user_id
        and package_id = _package_id
        and status = 'active'
    )
    or exists (
      select 1
      from public.profiles
      where id = _user_id
        and packages_unlocked = true
    )
$$;

revoke execute on function public.is_office_consultant(uuid) from public, anon, authenticated;
revoke execute on function public.has_package_access(uuid, text) from public, anon, authenticated;
