-- Corrective migration for deployments where the initial client-project
-- migration has already been applied. A request key is a replay key, not a
-- reusable project template key.
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
  if found then
    if result.user_id <> p_client_id
      or result.name_ar is distinct from nullif(trim(p_name_ar), '')
      or result.name_en is distinct from nullif(trim(p_name_en), '') then
      raise exception 'creation_request_id was already used with a different payload';
    end if;
    return result;
  end if;
  if nullif(trim(p_name_ar), '') is null then raise exception 'project name is required'; end if;
  insert into public.client_projects(user_id, name_ar, name_en, creation_request_id, created_by)
  values (p_client_id, trim(p_name_ar), nullif(trim(p_name_en), ''), p_creation_request_id, auth.uid())
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
