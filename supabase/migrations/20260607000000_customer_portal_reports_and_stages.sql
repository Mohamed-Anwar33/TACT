-- 1. Update configurator_selections RLS to allow customers to view their own reports created by consultants
CREATE POLICY "Clients view own session selections" ON public.configurator_selections FOR SELECT TO authenticated USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and (
        profiles.phone = configurator_selections.client_phone 
        or profiles.email = configurator_selections.client_email
      )
  )
);

-- 2. Create project_stages table
CREATE TABLE IF NOT EXISTS public.project_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_number INT NOT NULL CHECK (stage_number BETWEEN 1 AND 4),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  notes_ar TEXT,
  notes_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, stage_number)
);

-- 3. Create project_stage_files table
CREATE TABLE IF NOT EXISTS public.project_stage_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES public.project_stages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf', 'other')),
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('site_photo', 'invoice', 'statement', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create project_stage_notes table
CREATE TABLE IF NOT EXISTS public.project_stage_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES public.project_stages(id) ON DELETE CASCADE,
  note_ar TEXT NOT NULL,
  note_en TEXT,
  status_ar TEXT,
  status_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stage_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stage_notes ENABLE ROW LEVEL SECURITY;

-- 6. Setup RLS Policies

-- For project_stages
CREATE POLICY "Admins manage stages" ON public.project_stages FOR ALL TO authenticated USING (
  public.can_manage_clients(auth.uid())
) WITH CHECK (
  public.can_manage_clients(auth.uid())
);

CREATE POLICY "Customers view own stages" ON public.project_stages FOR SELECT TO authenticated USING (
  user_id = auth.uid()
);

-- For project_stage_files
CREATE POLICY "Admins manage stage files" ON public.project_stage_files FOR ALL TO authenticated USING (
  public.can_manage_clients(auth.uid())
) WITH CHECK (
  public.can_manage_clients(auth.uid())
);

CREATE POLICY "Customers view stage files" ON public.project_stage_files FOR SELECT TO authenticated USING (
  exists (
    select 1 from public.project_stages
    where id = stage_id and user_id = auth.uid()
  )
);

-- For project_stage_notes
CREATE POLICY "Admins manage stage notes" ON public.project_stage_notes FOR ALL TO authenticated USING (
  public.can_manage_clients(auth.uid())
) WITH CHECK (
  public.can_manage_clients(auth.uid())
);

CREATE POLICY "Customers view stage notes" ON public.project_stage_notes FOR SELECT TO authenticated USING (
  exists (
    select 1 from public.project_stages
    where id = stage_id and user_id = auth.uid()
  )
);

-- 7. Grant Permissions to roles
GRANT ALL ON TABLE public.project_stages TO authenticated, service_role;
GRANT ALL ON TABLE public.project_stage_files TO authenticated, service_role;
GRANT ALL ON TABLE public.project_stage_notes TO authenticated, service_role;
