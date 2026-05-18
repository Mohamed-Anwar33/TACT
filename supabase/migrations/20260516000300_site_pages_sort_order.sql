alter table public.site_pages
  add column if not exists sort_order int not null default 0;
