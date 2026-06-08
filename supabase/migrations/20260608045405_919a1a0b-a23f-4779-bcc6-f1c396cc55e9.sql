
-- 1) Project types
CREATE TABLE public.restaurant_project_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurant_project_types TO anon, authenticated;
GRANT ALL ON public.restaurant_project_types TO service_role;
ALTER TABLE public.restaurant_project_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_types readable by everyone" ON public.restaurant_project_types FOR SELECT USING (true);
CREATE POLICY "admins manage project_types" ON public.restaurant_project_types FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_project_types_updated BEFORE UPDATE ON public.restaurant_project_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Equipment catalog
CREATE TABLE public.restaurant_equipment (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  manufacturer text,
  country_of_origin text,
  description text,
  image_url text,
  category text,
  price_new numeric(12,2) NOT NULL DEFAULT 0,
  price_used numeric(12,2) NOT NULL DEFAULT 0,
  project_type_slugs text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurant_equipment TO anon, authenticated;
GRANT ALL ON public.restaurant_equipment TO service_role;
ALTER TABLE public.restaurant_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipment readable by everyone" ON public.restaurant_equipment FOR SELECT USING (true);
CREATE POLICY "admins manage equipment" ON public.restaurant_equipment FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_equipment_updated BEFORE UPDATE ON public.restaurant_equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Calculator settings (key/value json)
CREATE TABLE public.restaurant_calc_settings (
  key text NOT NULL PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurant_calc_settings TO anon, authenticated;
GRANT ALL ON public.restaurant_calc_settings TO service_role;
ALTER TABLE public.restaurant_calc_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calc_settings readable by everyone" ON public.restaurant_calc_settings FOR SELECT USING (true);
CREATE POLICY "admins manage calc_settings" ON public.restaurant_calc_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 4) Saved projects
CREATE TABLE public.saved_restaurant_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'مشروعي',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  total numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_restaurant_projects TO authenticated;
GRANT ALL ON public.saved_restaurant_projects TO service_role;
ALTER TABLE public.saved_restaurant_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own projects" ON public.saved_restaurant_projects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_saved_projects_updated BEFORE UPDATE ON public.saved_restaurant_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default project types
INSERT INTO public.restaurant_project_types (name, slug, icon, sort_order) VALUES
  ('مطعم', 'restaurant', 'UtensilsCrossed', 1),
  ('كوفي شوب', 'coffee', 'Coffee', 2),
  ('مخبز', 'bakery', 'Croissant', 3),
  ('مطبخ مركزي', 'central-kitchen', 'ChefHat', 4),
  ('وجبات سريعة', 'fastfood', 'Sandwich', 5),
  ('محل عصائر', 'juice', 'CupSoda', 6),
  ('محل حلويات', 'sweets', 'Cake', 7),
  ('مشروع مخصص', 'custom', 'Settings2', 8);

-- Seed calculator settings (steel table + sink) so prices come from DB not code
INSERT INTO public.restaurant_calc_settings (key, value) VALUES
  ('steel_table', '{"base":{"width":100,"depth":60},"grades":{"201":{"base":60,"midShelf":{"lt100":15,"lt200":20,"gte200":25}},"304":{"base":80,"midShelf":{"lt100":20,"lt200":30,"gte200":40}}}}'::jsonb),
  ('sink', '{"base":{"width":100,"depth":60,"price":90,"bowl":{"w":45,"d":45}},"extraBowl":25,"bottomShelf":{"lt100":20,"lt200":30,"gte200":40},"depths":[10,15,20,25,30,35,40],"defaultDepth":30}'::jsonb);
