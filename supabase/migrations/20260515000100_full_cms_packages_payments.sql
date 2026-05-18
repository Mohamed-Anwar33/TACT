-- Full CMS, editable package catalog, scoped unlocks, and configurable payment methods.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client_followup';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'technical_office';

ALTER TABLE public.payment_submissions
  ADD COLUMN IF NOT EXISTS package_id TEXT,
  ADD COLUMN IF NOT EXISTS proof_url TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.packages (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  price_label TEXT,
  unit_label_en TEXT DEFAULT 'EGP / m2',
  unit_label_ar TEXT DEFAULT 'جنيه / م²',
  badge_en TEXT,
  badge_ar TEXT,
  features_en JSONB NOT NULL DEFAULT '[]'::jsonb,
  features_ar JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.package_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id TEXT NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.package_styles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.package_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  style_id UUID NOT NULL REFERENCES public.package_styles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.package_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.package_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.package_categories(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.package_options ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.package_option_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID NOT NULL REFERENCES public.package_options(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  alt_en TEXT,
  alt_ar TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.package_option_media ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.package_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payment_submissions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  unlocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, package_id)
);
ALTER TABLE public.package_unlocks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'instapay',
  label_en TEXT NOT NULL,
  label_ar TEXT NOT NULL,
  account_name TEXT,
  ipa TEXT,
  phone TEXT,
  account_number TEXT,
  qr_url TEXT,
  instructions_en TEXT,
  instructions_ar TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL,
  block_key TEXT NOT NULL,
  block_type TEXT NOT NULL DEFAULT 'text',
  title_en TEXT,
  title_ar TEXT,
  body_en TEXT,
  body_ar TEXT,
  media_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(page_slug, block_key)
);
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT NOT NULL DEFAULT 'tact-media',
  path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  media_type TEXT NOT NULL,
  title TEXT,
  alt TEXT,
  size_bytes BIGINT,
  width INT,
  height INT,
  duration_seconds NUMERIC,
  source_folder TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'manager', 'client_followup', 'technical_office')
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_content(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'manager', 'technical_office')
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_clients(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'manager', 'client_followup')
  )
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_customer_unlock_flag_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.packages_unlocked IS DISTINCT FROM OLD.packages_unlocked
    AND NOT public.can_manage_clients(auth.uid())
  THEN
    RAISE EXCEPTION 'Only staff can change package access';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS packages_touch_updated_at ON public.packages;
CREATE TRIGGER packages_touch_updated_at BEFORE UPDATE ON public.packages
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS payment_methods_touch_updated_at ON public.payment_methods;
CREATE TRIGGER payment_methods_touch_updated_at BEFORE UPDATE ON public.payment_methods
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS site_pages_touch_updated_at ON public.site_pages;
CREATE TRIGGER site_pages_touch_updated_at BEFORE UPDATE ON public.site_pages
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS content_blocks_touch_updated_at ON public.content_blocks;
CREATE TRIGGER content_blocks_touch_updated_at BEFORE UPDATE ON public.content_blocks
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS profiles_prevent_customer_unlock_flag_update ON public.profiles;
CREATE TRIGGER profiles_prevent_customer_unlock_flag_update BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_customer_unlock_flag_update();

-- Policies
CREATE POLICY "Public read published packages" ON public.packages
  FOR SELECT TO anon, authenticated USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "Technical staff manage packages" ON public.packages
  FOR ALL TO authenticated USING (public.can_manage_content(auth.uid())) WITH CHECK (public.can_manage_content(auth.uid()));

CREATE POLICY "Public read published package styles" ON public.package_styles
  FOR SELECT TO anon, authenticated USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "Technical staff manage package styles" ON public.package_styles
  FOR ALL TO authenticated USING (public.can_manage_content(auth.uid())) WITH CHECK (public.can_manage_content(auth.uid()));

CREATE POLICY "Public read published package categories" ON public.package_categories
  FOR SELECT TO anon, authenticated USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "Technical staff manage package categories" ON public.package_categories
  FOR ALL TO authenticated USING (public.can_manage_content(auth.uid())) WITH CHECK (public.can_manage_content(auth.uid()));

CREATE POLICY "Public read published package options" ON public.package_options
  FOR SELECT TO anon, authenticated USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "Technical staff manage package options" ON public.package_options
  FOR ALL TO authenticated USING (public.can_manage_content(auth.uid())) WITH CHECK (public.can_manage_content(auth.uid()));

CREATE POLICY "Public read package option media" ON public.package_option_media
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Technical staff manage package option media" ON public.package_option_media
  FOR ALL TO authenticated USING (public.can_manage_content(auth.uid())) WITH CHECK (public.can_manage_content(auth.uid()));

CREATE POLICY "Users view own unlocks" ON public.package_unlocks
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Client followup manage unlocks" ON public.package_unlocks
  FOR ALL TO authenticated USING (public.can_manage_clients(auth.uid())) WITH CHECK (public.can_manage_clients(auth.uid()));

CREATE POLICY "Public read active payment methods" ON public.payment_methods
  FOR SELECT TO anon, authenticated USING (active OR public.can_manage_clients(auth.uid()));
CREATE POLICY "Client followup manage payment methods" ON public.payment_methods
  FOR ALL TO authenticated USING (public.can_manage_clients(auth.uid())) WITH CHECK (public.can_manage_clients(auth.uid()));

CREATE POLICY "Public read published pages" ON public.site_pages
  FOR SELECT TO anon, authenticated USING (published OR public.can_manage_content(auth.uid()));
CREATE POLICY "Technical staff manage pages" ON public.site_pages
  FOR ALL TO authenticated USING (public.can_manage_content(auth.uid())) WITH CHECK (public.can_manage_content(auth.uid()));

CREATE POLICY "Public read published content blocks" ON public.content_blocks
  FOR SELECT TO anon, authenticated USING (published OR public.can_manage_content(auth.uid()));
CREATE POLICY "Technical staff manage content blocks" ON public.content_blocks
  FOR ALL TO authenticated USING (public.can_manage_content(auth.uid())) WITH CHECK (public.can_manage_content(auth.uid()));

CREATE POLICY "Public read media assets" ON public.media_assets
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Technical staff manage media assets" ON public.media_assets
  FOR ALL TO authenticated USING (public.can_manage_content(auth.uid())) WITH CHECK (public.can_manage_content(auth.uid()));

CREATE POLICY "Public read site settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Managers manage site settings" ON public.site_settings
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Anyone can submit payment" ON public.payment_submissions;
CREATE POLICY "Authenticated users submit own payment" ON public.payment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending' AND length(coalesce(phone,'')) > 0);

-- Seed editable package shells and default payment method.
INSERT INTO public.packages (id, name_en, name_ar, description_en, description_ar, price_label, featured, badge_en, badge_ar, features_en, features_ar, sort_order)
VALUES
  ('economy', 'Basic', 'باقة أساسية', 'Essential finishing package for practical budgets.', 'باقة تشطيب أساسية مناسبة للميزانيات العملية.', '6,000', false, null, null, '["Core finishing choices","Business hours support","Basic reports"]'::jsonb, '["اختيارات التشطيب الأساسية","متابعة في أوقات العمل","تقارير أساسية"]'::jsonb, 1),
  ('medium', 'Standard', 'باقة متوسطة', 'Balanced package with wider materials and better finishes.', 'باقة متوازنة بخيارات خامات أوسع وتشطيبات أعلى.', '8,000', true, 'Best Value', 'الأفضل قيمة', '["Wider material options","Continuous support","Detailed reports"]'::jsonb, '["اختيارات خامات أوسع","دعم ومتابعة مستمرة","تقارير تفصيلية"]'::jsonb, 2),
  ('luxury', 'Premium', 'باقة فاخرة', 'Premium package for luxury materials and advanced detailing.', 'باقة فاخرة للخامات الراقية والتفاصيل المتقدمة.', '10,000', false, null, null, '["Luxury materials","Dedicated support","Advanced execution details"]'::jsonb, '["خامات فاخرة","متابعة مخصصة","تفاصيل تنفيذ متقدمة"]'::jsonb, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payment_methods (type, label_en, label_ar, account_name, ipa, phone, instructions_en, instructions_ar, sort_order)
VALUES ('instapay', 'InstaPay', 'إنستاباي', 'Tact Architecture', 'tact@instapay', '01032473330', 'Transfer the deposit, then submit the reference and send the receipt on WhatsApp.', 'حوّل العربون ثم سجل رقم العملية وأرسل الإيصال على واتساب.', 1)
ON CONFLICT DO NOTHING;

INSERT INTO public.site_pages (slug, title_en, title_ar)
VALUES
  ('home', 'Home', 'الرئيسية'),
  ('about', 'About Tact', 'عن تاكت'),
  ('services', 'Services', 'الخدمات'),
  ('team', 'Meet Our Team', 'فريق العمل'),
  ('portfolio', 'Portfolio', 'سابقة الأعمال'),
  ('testimonials', 'Testimonials', 'آراء العملاء'),
  ('questionnaire', 'Questionnaire', 'استبيان العميل'),
  ('payment', 'Payment', 'الدفع'),
  ('packages', 'Packages', 'الباقات'),
  ('contact', 'Contact', 'تواصل معنا')
ON CONFLICT (slug) DO NOTHING;

REVOKE EXECUTE ON FUNCTION public.is_staff(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_manage_content(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_manage_clients(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_customer_unlock_flag_update() FROM PUBLIC, anon, authenticated;
