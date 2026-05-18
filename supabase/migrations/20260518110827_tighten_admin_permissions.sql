-- Align dashboard role scopes with the frontend permission matrix.
-- admin: full access, manager: content + clients, technical_office: content,
-- client_followup: client follow-up data only.

-- Profiles are needed by client follow-up screens to identify customers.
drop policy if exists "Client staff view profiles" on public.profiles;
create policy "Client staff view profiles"
  on public.profiles for select to authenticated
  using (public.can_manage_clients(auth.uid()));

drop policy if exists "Client staff update profiles" on public.profiles;
create policy "Client staff update profiles"
  on public.profiles for update to authenticated
  using (public.can_manage_clients(auth.uid()))
  with check (public.can_manage_clients(auth.uid()));

-- Customer questionnaires.
drop policy if exists "Client staff view questionnaires" on public.questionnaires;
create policy "Client staff view questionnaires"
  on public.questionnaires for select to authenticated
  using (public.can_manage_clients(auth.uid()));

drop policy if exists "Client staff delete questionnaires" on public.questionnaires;
create policy "Client staff delete questionnaires"
  on public.questionnaires for delete to authenticated
  using (public.can_manage_clients(auth.uid()));

-- Contact messages.
drop policy if exists "Client staff view contact messages" on public.contact_messages;
create policy "Client staff view contact messages"
  on public.contact_messages for select to authenticated
  using (public.can_manage_clients(auth.uid()));

drop policy if exists "Client staff delete contact messages" on public.contact_messages;
create policy "Client staff delete contact messages"
  on public.contact_messages for delete to authenticated
  using (public.can_manage_clients(auth.uid()));

-- Payment review and approval.
drop policy if exists "Client staff view payments" on public.payment_submissions;
create policy "Client staff view payments"
  on public.payment_submissions for select to authenticated
  using (public.can_manage_clients(auth.uid()));

drop policy if exists "Client staff update payments" on public.payment_submissions;
create policy "Client staff update payments"
  on public.payment_submissions for update to authenticated
  using (public.can_manage_clients(auth.uid()))
  with check (public.can_manage_clients(auth.uid()));

-- Client selections can be reviewed/exported and removed by follow-up staff.
drop policy if exists "Client staff view selections" on public.configurator_selections;
create policy "Client staff view selections"
  on public.configurator_selections for select to authenticated
  using (public.can_manage_clients(auth.uid()));

drop policy if exists "Client staff delete selections" on public.configurator_selections;
create policy "Client staff delete selections"
  on public.configurator_selections for delete to authenticated
  using (public.can_manage_clients(auth.uid()));

-- Settings are admin-only at the dashboard route level.
drop policy if exists "Managers manage site settings" on public.site_settings;
drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
  on public.site_settings for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Storage: customers can upload receipts only under their own payments folder.
-- CMS media remains writable only by content staff.
drop policy if exists "Staff upload tact-media" on storage.objects;
drop policy if exists "Staff update tact-media" on storage.objects;
drop policy if exists "Staff delete tact-media" on storage.objects;
drop policy if exists "Content staff upload tact-media" on storage.objects;
drop policy if exists "Content staff update tact-media" on storage.objects;
drop policy if exists "Content staff delete tact-media" on storage.objects;
drop policy if exists "Authenticated upload own payment receipts" on storage.objects;

create policy "Authenticated upload own payment receipts"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tact-media'
    and name like ('payments/' || auth.uid()::text || '/%')
  );

create policy "Content staff upload tact-media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tact-media'
    and public.can_manage_content(auth.uid())
    and name not like 'payments/%'
  );

create policy "Content staff update tact-media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'tact-media'
    and public.can_manage_content(auth.uid())
    and name not like 'payments/%'
  )
  with check (
    bucket_id = 'tact-media'
    and public.can_manage_content(auth.uid())
    and name not like 'payments/%'
  );

create policy "Content staff delete tact-media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'tact-media'
    and public.can_manage_content(auth.uid())
    and name not like 'payments/%'
  );
