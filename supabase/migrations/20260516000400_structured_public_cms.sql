create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_en text not null,
  title_ar text not null,
  nav_label_en text,
  nav_label_ar text,
  sort_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cms_pages enable row level security;

create table if not exists public.cms_sections (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null references public.cms_pages(slug) on delete cascade,
  section_key text not null,
  section_name_en text not null,
  section_name_ar text not null,
  title_en text,
  title_ar text,
  body_en text,
  body_ar text,
  cta_label_en text,
  cta_label_ar text,
  cta_url text,
  sort_order int not null default 0,
  visible boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(page_slug, section_key)
);
alter table public.cms_sections enable row level security;

create table if not exists public.cms_section_media (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.cms_sections(id) on delete cascade,
  role text not null default 'image',
  media_type text not null default 'image',
  url text not null,
  title_en text,
  title_ar text,
  alt_en text,
  alt_ar text,
  sort_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique(section_id, role, url)
);
alter table public.cms_section_media enable row level security;

create table if not exists public.cms_services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  number_label text,
  title_en text not null,
  title_ar text not null,
  short_en text,
  short_ar text,
  detail_en text,
  detail_ar text,
  icon text,
  image_url text,
  video_url text,
  sort_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cms_services enable row level security;

create table if not exists public.cms_projects (
  id text primary key,
  title_en text not null,
  title_ar text not null,
  category_en text,
  category_ar text,
  area text,
  description_en text,
  description_ar text,
  cover_url text,
  video_url text,
  pdf_url text,
  external_url text,
  sort_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cms_projects enable row level security;

create table if not exists public.cms_project_media (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.cms_projects(id) on delete cascade,
  media_type text not null default 'image',
  role text not null default 'gallery',
  url text not null,
  title_en text,
  title_ar text,
  sort_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique(project_id, url)
);
alter table public.cms_project_media enable row level security;

create table if not exists public.cms_team_members (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ar text not null,
  role_en text,
  role_ar text,
  department text not null default 'team',
  bio_en text,
  bio_ar text,
  image_url text,
  social_links jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cms_team_members enable row level security;

create table if not exists public.cms_clients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ar text not null,
  logo_url text,
  description_en text,
  description_ar text,
  sort_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cms_clients enable row level security;

create table if not exists public.cms_client_testimonials (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.cms_clients(id) on delete set null,
  client_name_en text,
  client_name_ar text,
  role_en text,
  role_ar text,
  quote_en text,
  quote_ar text,
  rating int not null default 5,
  image_url text,
  video_url text,
  video_cover_url text,
  sort_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cms_client_testimonials enable row level security;

create table if not exists public.cms_contact_settings (
  id boolean primary key default true,
  phone_numbers jsonb not null default '[]'::jsonb,
  whatsapp text,
  email text,
  address_en text,
  address_ar text,
  map_url text,
  social_links jsonb not null default '{}'::jsonb,
  title_en text,
  title_ar text,
  body_en text,
  body_ar text,
  updated_at timestamptz not null default now(),
  constraint cms_contact_settings_singleton check (id)
);
alter table public.cms_contact_settings enable row level security;

create or replace function public.cms_touch_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'cms_pages','cms_sections','cms_services','cms_projects','cms_team_members','cms_clients','cms_client_testimonials'
  ] loop
    execute format('drop trigger if exists %I_touch_updated_at on public.%I', table_name, table_name);
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function public.cms_touch_updated_at()', table_name, table_name);
  end loop;
end $$;

create or replace function public.cms_public_visible(_visible boolean)
returns boolean language sql stable
as $$ select coalesce(_visible, false) or public.can_manage_content(auth.uid()) $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'cms_pages','cms_sections','cms_section_media','cms_services','cms_projects','cms_project_media','cms_team_members','cms_clients','cms_client_testimonials','cms_contact_settings'
  ] loop
    execute format('drop policy if exists "Public read visible %s" on public.%I', table_name, table_name);
    execute format('drop policy if exists "Content staff manage %s" on public.%I', table_name, table_name);
    if table_name = 'cms_contact_settings' then
      execute format('create policy "Public read visible %s" on public.%I for select to anon, authenticated using (true)', table_name, table_name);
    else
      execute format('create policy "Public read visible %s" on public.%I for select to anon, authenticated using (public.cms_public_visible(visible))', table_name, table_name);
    end if;
    execute format('create policy "Content staff manage %s" on public.%I for all to authenticated using (public.can_manage_content(auth.uid())) with check (public.can_manage_content(auth.uid()))', table_name, table_name);
  end loop;
end $$;

grant select on public.cms_pages, public.cms_sections, public.cms_section_media, public.cms_services, public.cms_projects, public.cms_project_media, public.cms_team_members, public.cms_clients, public.cms_client_testimonials, public.cms_contact_settings to anon, authenticated;
grant insert, update, delete on public.cms_pages, public.cms_sections, public.cms_section_media, public.cms_services, public.cms_projects, public.cms_project_media, public.cms_team_members, public.cms_clients, public.cms_client_testimonials, public.cms_contact_settings to authenticated;
grant execute on function public.cms_public_visible(boolean) to anon, authenticated;
