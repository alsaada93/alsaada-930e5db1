
-- ===== Products =====
CREATE TABLE public.restaurant_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'table',
  base_price numeric NOT NULL DEFAULT 0,
  image_url text,
  options jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurant_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_products TO authenticated;
GRANT ALL ON public.restaurant_products TO service_role;
ALTER TABLE public.restaurant_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products readable by everyone" ON public.restaurant_products FOR SELECT USING (true);
CREATE POLICY "products admin insert" ON public.restaurant_products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "products admin update" ON public.restaurant_products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "products admin delete" ON public.restaurant_products FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.restaurant_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Accessories =====
CREATE TABLE public.restaurant_accessories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  price numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurant_accessories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_accessories TO authenticated;
GRANT ALL ON public.restaurant_accessories TO service_role;
ALTER TABLE public.restaurant_accessories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accessories readable by everyone" ON public.restaurant_accessories FOR SELECT USING (true);
CREATE POLICY "accessories admin insert" ON public.restaurant_accessories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "accessories admin update" ON public.restaurant_accessories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "accessories admin delete" ON public.restaurant_accessories FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_accessories_updated BEFORE UPDATE ON public.restaurant_accessories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Usage events (statistics) =====
CREATE TABLE public.restaurant_calc_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text,
  product_name text,
  total_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.restaurant_calc_events TO anon, authenticated;
GRANT SELECT ON public.restaurant_calc_events TO authenticated;
GRANT ALL ON public.restaurant_calc_events TO service_role;
ALTER TABLE public.restaurant_calc_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events insert by anyone" ON public.restaurant_calc_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "events readable by admin" ON public.restaurant_calc_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
