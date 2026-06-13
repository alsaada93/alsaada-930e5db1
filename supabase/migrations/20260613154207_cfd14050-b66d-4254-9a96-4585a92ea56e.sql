-- توسعة جدول المعدات
ALTER TABLE public.restaurant_equipment
  ADD COLUMN IF NOT EXISTS condition text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS used_condition text,
  ADD COLUMN IF NOT EXISTS specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS linked_listing_id uuid,
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS essential boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cost_layer text NOT NULL DEFAULT 'core',
  ADD COLUMN IF NOT EXISTS default_qty integer NOT NULL DEFAULT 1;

-- جدول الباقات الجاهزة
CREATE TABLE IF NOT EXISTS public.restaurant_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_type_slug text NOT NULL,
  tier text NOT NULL DEFAULT 'standard',
  name text NOT NULL,
  description text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.restaurant_packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_packages TO authenticated;
GRANT ALL ON public.restaurant_packages TO service_role;

ALTER TABLE public.restaurant_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packages readable by everyone" ON public.restaurant_packages
  FOR SELECT USING (true);
CREATE POLICY "admins manage packages" ON public.restaurant_packages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_packages_updated BEFORE UPDATE ON public.restaurant_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- جدول العملاء المهتمين (Leads)
CREATE TABLE IF NOT EXISTS public.restaurant_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  whatsapp text NOT NULL,
  project_type_slug text,
  project_name text,
  total numeric(14,2) NOT NULL DEFAULT 0,
  project_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.restaurant_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_leads TO authenticated;
GRANT ALL ON public.restaurant_leads TO service_role;

ALTER TABLE public.restaurant_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can submit a lead" ON public.restaurant_leads
  FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read leads" ON public.restaurant_leads
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins delete leads" ON public.restaurant_leads
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- رابط مشاركة عام للمشاريع المحفوظة
ALTER TABLE public.saved_restaurant_projects
  ADD COLUMN IF NOT EXISTS share_slug text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_projects_share_slug
  ON public.saved_restaurant_projects(share_slug) WHERE share_slug IS NOT NULL;

CREATE POLICY "public read shared projects" ON public.saved_restaurant_projects
  FOR SELECT USING (share_slug IS NOT NULL);

GRANT SELECT ON public.saved_restaurant_projects TO anon;