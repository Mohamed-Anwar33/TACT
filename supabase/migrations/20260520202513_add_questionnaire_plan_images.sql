alter table public.questionnaires
  add column if not exists plan_images jsonb not null default '[]'::jsonb;

drop policy if exists "Anyone upload questionnaire plan images" on storage.objects;
create policy "Anyone upload questionnaire plan images"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'tact-media'
    and name like 'questionnaires/%'
  );
