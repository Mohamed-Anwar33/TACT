alter table public.cms_projects
  add column if not exists tour360_url text;

-- PostgREST API permission adjustments
grant select on public.cms_projects to anon, authenticated;
grant insert, update, delete on public.cms_projects to authenticated;
