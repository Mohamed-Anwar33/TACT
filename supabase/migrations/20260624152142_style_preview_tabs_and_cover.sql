-- Keep a style cover separate from its gallery images. The previous implementation
-- used a fixed package option name, which conflicts with the category/name key.
alter table public.package_styles
  add column if not exists cover_url text;

update public.package_styles style
set cover_url = (
  select option_row.image_url
  from public.package_categories category_row
  join public.package_options option_row on option_row.category_id = category_row.id
  where category_row.style_id = style.id
    and category_row.slug = 'style-preview'
    and option_row.name_en = 'Style Preview Option'
  order by option_row.created_at desc
  limit 1
)
where style.cover_url is null
  and exists (
    select 1
    from public.package_categories category_row
    join public.package_options option_row on option_row.category_id = category_row.id
    where category_row.style_id = style.id
      and category_row.slug = 'style-preview'
      and option_row.name_en = 'Style Preview Option'
  );

delete from public.package_options
where name_en = 'Style Preview Option'
  and category_id in (select id from public.package_categories where slug = 'style-preview');

create table if not exists public.package_style_preview_tabs (
  id uuid primary key default gen_random_uuid(),
  style_id uuid not null references public.package_styles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (style_id, name)
);

alter table public.package_style_preview_tabs enable row level security;

drop policy if exists "Public read style preview tabs" on public.package_style_preview_tabs;
create policy "Public read style preview tabs" on public.package_style_preview_tabs
  for select to anon, authenticated using (true);

drop policy if exists "Technical staff manage style preview tabs" on public.package_style_preview_tabs;
create policy "Technical staff manage style preview tabs" on public.package_style_preview_tabs
  for all to authenticated
  using (public.can_manage_content(auth.uid()))
  with check (public.can_manage_content(auth.uid()));

insert into public.package_style_preview_tabs (style_id, name, sort_order)
select distinct category_row.style_id, nullif(substr(option_row.description_en, 5), ''), 10
from public.package_categories category_row
join public.package_options option_row on option_row.category_id = category_row.id
where category_row.slug = 'style-preview'
  and option_row.description_en like 'tab:%'
  and nullif(substr(option_row.description_en, 5), '') is not null
on conflict (style_id, name) do nothing;

insert into public.package_style_preview_tabs (style_id, name, sort_order)
select style.id, 'الصفحة الأولى', 0
from public.package_styles style
on conflict (style_id, name) do nothing;

-- Older gallery data can contain duplicate sort values within one tab. Normalize
-- it once so order is deterministic before editors start drag-reordering again.
with normalized_orders as (
  select option_row.id,
    row_number() over (
      partition by option_row.category_id,
        coalesce(nullif(substr(option_row.description_en, 5), ''), 'الصفحة الأولى')
      order by option_row.sort_order, option_row.created_at, option_row.id
    ) * 10 as sort_order
  from public.package_categories category_row
  join public.package_options option_row on option_row.category_id = category_row.id
  where category_row.slug = 'style-preview'
)
update public.package_options option_row
set sort_order = normalized_orders.sort_order
from normalized_orders
where option_row.id = normalized_orders.id
  and option_row.sort_order is distinct from normalized_orders.sort_order;
