grant execute on function public.can_manage_content(uuid) to anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;
