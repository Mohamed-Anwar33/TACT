-- Tighten public INSERT policies (replace permissive 'true' with field checks)
DROP POLICY "Anyone can submit questionnaire" ON public.questionnaires;
CREATE POLICY "Anyone can submit questionnaire" ON public.questionnaires
  FOR INSERT TO anon, authenticated
  WITH CHECK (length(coalesce(name,'')) > 0 AND length(coalesce(phone,'')) > 0);

DROP POLICY "Anyone can send message" ON public.contact_messages;
CREATE POLICY "Anyone can send message" ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (length(name) > 0 AND length(phone) > 0 AND length(message) > 0);

DROP POLICY "Anyone can submit payment" ON public.payment_submissions;
CREATE POLICY "Anyone can submit payment" ON public.payment_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (length(coalesce(phone,'')) > 0 AND status = 'pending');

-- Lock down SECURITY DEFINER helpers from direct API exposure
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Restrict storage listing (keep public read of objects via signed/public URLs)
DROP POLICY "Public read tact-media" ON storage.objects;
CREATE POLICY "Authenticated list tact-media" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'tact-media');
CREATE POLICY "Anon read tact-media files" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'tact-media' AND name IS NOT NULL);