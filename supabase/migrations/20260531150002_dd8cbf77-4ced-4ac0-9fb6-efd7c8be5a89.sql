CREATE TABLE public.listings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  listing_type text NOT NULL DEFAULT 'normal',
  title text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  negotiable boolean NOT NULL DEFAULT false,
  condition text NOT NULL DEFAULT 'مستعمل',
  category_id text,
  group_name text,
  item_name text,
  city text,
  lat numeric,
  lng numeric,
  images text[] NOT NULL DEFAULT '{}',
  video text,
  contact_name text,
  contact_phone text,
  status text NOT NULL DEFAULT 'approved',
  views integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  -- auction
  start_price numeric,
  auction_ends_at timestamptz,
  -- business
  rent numeric,
  area_sqm numeric,
  outlets integer,
  staff_count integer,
  has_license boolean,
  monthly_revenue numeric,
  operating_cost numeric,
  includes_equipment boolean,
  sale_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved listings are viewable by everyone"
ON public.listings FOR SELECT
USING (status = 'approved' OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can create a listing"
ON public.listings FOR INSERT
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Owners can update their listings"
ON public.listings FOR UPDATE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can delete their listings"
ON public.listings FOR DELETE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_listings_category ON public.listings (category_id);
CREATE INDEX idx_listings_status ON public.listings (status);
CREATE INDEX idx_listings_created ON public.listings (created_at DESC);

-- Storage bucket for listing media
INSERT INTO storage.buckets (id, name, public) VALUES ('listings', 'listings', true);

CREATE POLICY "Listing media is publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'listings');

CREATE POLICY "Anyone can upload listing media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listings');