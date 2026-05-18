drop policy if exists "Admins upload tact-media" on storage.objects;
drop policy if exists "Admins update tact-media" on storage.objects;
drop policy if exists "Admins delete tact-media" on storage.objects;

create policy "Staff upload tact-media"
on storage.objects for insert to authenticated
with check (bucket_id = 'tact-media' and public.is_staff(auth.uid()));

create policy "Staff update tact-media"
on storage.objects for update to authenticated
using (bucket_id = 'tact-media' and public.is_staff(auth.uid()))
with check (bucket_id = 'tact-media' and public.is_staff(auth.uid()));

create policy "Staff delete tact-media"
on storage.objects for delete to authenticated
using (bucket_id = 'tact-media' and public.is_staff(auth.uid()));
