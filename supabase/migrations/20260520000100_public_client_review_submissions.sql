grant insert on public.cms_client_testimonials to anon, authenticated;

drop policy if exists "Anyone can submit hidden client testimonials" on public.cms_client_testimonials;
create policy "Anyone can submit hidden client testimonials"
  on public.cms_client_testimonials
  for insert
  to anon, authenticated
  with check (
    visible = false
    and length(trim(coalesce(client_name_ar, client_name_en, ''))) > 0
    and length(trim(coalesce(quote_ar, quote_en, ''))) > 0
    and coalesce(rating, 5) between 1 and 5
  );

drop policy if exists "Anyone upload client review images" on storage.objects;
create policy "Anyone upload client review images"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'tact-media'
    and (storage.foldername(name))[1] = 'client-review-submissions'
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
  );
