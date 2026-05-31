-- Notifications
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id uuid NOT NULL,
  listing_id uuid,
  type text NOT NULL DEFAULT 'contact',
  message text,
  sender_name text,
  sender_phone text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO anon;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create a notification" ON public.notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Recipients can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = recipient_id);
CREATE POLICY "Recipients can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = recipient_id);
CREATE POLICY "Recipients can delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = recipient_id);
CREATE INDEX idx_notifications_recipient ON public.notifications (recipient_id, created_at DESC);

-- Price offers
CREATE TABLE public.price_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  sender_id uuid,
  amount numeric NOT NULL,
  message text,
  sender_name text,
  sender_phone text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_offers TO authenticated;
GRANT INSERT ON public.price_offers TO anon;
GRANT ALL ON public.price_offers TO service_role;
ALTER TABLE public.price_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send an offer" ON public.price_offers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Recipients view offers" ON public.price_offers FOR SELECT TO authenticated USING (auth.uid() = recipient_id OR auth.uid() = sender_id);
CREATE POLICY "Recipients update offers" ON public.price_offers FOR UPDATE TO authenticated USING (auth.uid() = recipient_id);
CREATE INDEX idx_price_offers_recipient ON public.price_offers (recipient_id, created_at DESC);

-- Listing translations cache
CREATE TABLE public.listing_translations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL,
  lang text NOT NULL,
  title text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, lang)
);
GRANT SELECT ON public.listing_translations TO anon, authenticated;
GRANT ALL ON public.listing_translations TO service_role;
ALTER TABLE public.listing_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Translations are viewable by everyone" ON public.listing_translations FOR SELECT USING (true);

-- View increment function
CREATE OR REPLACE FUNCTION public.increment_listing_views(_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.listings SET views = views + 1 WHERE id = _id;
$$;
GRANT EXECUTE ON FUNCTION public.increment_listing_views(uuid) TO anon, authenticated;