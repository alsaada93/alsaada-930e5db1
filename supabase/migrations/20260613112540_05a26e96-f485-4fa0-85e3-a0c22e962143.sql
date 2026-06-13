
-- ============ فئات التفصيل ============
CREATE TABLE public.fabrication_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  description text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fabrication_categories TO anon, authenticated;
GRANT ALL ON public.fabrication_categories TO service_role;
ALTER TABLE public.fabrication_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON public.fabrication_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.fabrication_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ منتجات التفصيل ============
CREATE TABLE public.fabrication_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid REFERENCES public.fabrication_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  image_url text,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text,
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  base_price numeric NOT NULL DEFAULT 0,
  price_per_m2 numeric NOT NULL DEFAULT 0,
  fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  pricing jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fabrication_products TO anon, authenticated;
GRANT ALL ON public.fabrication_products TO service_role;
ALTER TABLE public.fabrication_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone" ON public.fabrication_products FOR SELECT USING (true);
CREATE POLICY "Admins manage products" ON public.fabrication_products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ إعدادات الحاسبة ============
CREATE TABLE public.fabrication_settings (
  key text NOT NULL PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fabrication_settings TO anon, authenticated;
GRANT ALL ON public.fabrication_settings TO service_role;
ALTER TABLE public.fabrication_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are viewable by everyone" ON public.fabrication_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.fabrication_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ مشاريع التفصيل ============
CREATE TABLE public.fabrication_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'مشروعي',
  customer_name text,
  customer_phone text,
  status text NOT NULL DEFAULT 'draft',
  total numeric NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fabrication_projects TO authenticated;
GRANT ALL ON public.fabrication_projects TO service_role;
ALTER TABLE public.fabrication_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own projects" ON public.fabrication_projects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all projects" ON public.fabrication_projects FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ مشغّلات التحديث ============
CREATE TRIGGER trg_fab_categories_updated BEFORE UPDATE ON public.fabrication_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_fab_products_updated BEFORE UPDATE ON public.fabrication_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_fab_settings_updated BEFORE UPDATE ON public.fabrication_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_fab_projects_updated BEFORE UPDATE ON public.fabrication_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
