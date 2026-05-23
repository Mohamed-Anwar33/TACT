alter table public.cms_project_media
  add column if not exists alt_en text,
  add column if not exists alt_ar text;

grant select on public.cms_project_media to anon, authenticated;
grant insert, update, delete on public.cms_project_media to authenticated;
