grant insert on public.cms_client_testimonials to anon, authenticated;

drop policy if exists "Anyone can submit hidden client testimonials" on public.cms_client_testimonials;
create policy "Anyone can submit hidden client testimonials"
  on public.cms_client_testimonials
  for insert
  to anon, authenticated
  with check (
    coalesce(visible, false) = false
    and length(trim(coalesce(client_name_ar, client_name_en, ''))) > 0
    and length(trim(coalesce(quote_ar, quote_en, ''))) > 0
    and coalesce(rating, 5) between 1 and 5
    and image_url is null
    and video_url is null
    and video_cover_url is null
  );
