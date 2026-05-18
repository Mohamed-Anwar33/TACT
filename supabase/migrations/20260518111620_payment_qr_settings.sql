-- Payment methods are now controlled from the admin settings screen.
-- Public users only read the active method and admins are the only role allowed to edit it.

drop policy if exists "Client followup manage payment methods" on public.payment_methods;
drop policy if exists "Admins manage payment methods" on public.payment_methods;

create policy "Admins manage payment methods"
  on public.payment_methods for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

update public.payment_methods
set
  type = 'instapay',
  label_en = 'InstaPay',
  label_ar = 'إنستاباي',
  account_name = null,
  account_number = null,
  instructions_en = null,
  instructions_ar = null,
  active = true,
  sort_order = 1
where type = 'instapay';
