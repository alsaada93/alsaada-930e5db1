-- Real auction bids
CREATE TABLE public.auction_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_auction_bids_listing ON public.auction_bids(listing_id, amount DESC);

GRANT SELECT ON public.auction_bids TO anon;
GRANT SELECT, INSERT ON public.auction_bids TO authenticated;
GRANT ALL ON public.auction_bids TO service_role;

ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

-- Anyone can see bids (for counts and current price)
CREATE POLICY "Bids are viewable by everyone"
ON public.auction_bids
FOR SELECT
USING (true);

-- Only logged-in users can place their own bids
CREATE POLICY "Authenticated users can place bids"
ON public.auction_bids
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Validate the new bid is higher than starting price and current highest bid
CREATE OR REPLACE FUNCTION public.validate_auction_bid()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_highest NUMERIC;
BEGIN
  SELECT * INTO v_listing FROM public.listings WHERE id = NEW.listing_id;
  IF v_listing.id IS NULL THEN
    RAISE EXCEPTION 'listing not found';
  END IF;
  IF v_listing.listing_type <> 'auction' THEN
    RAISE EXCEPTION 'listing is not an auction';
  END IF;
  IF v_listing.auction_ends_at IS NOT NULL AND v_listing.auction_ends_at < now() THEN
    RAISE EXCEPTION 'auction has ended';
  END IF;

  SELECT max(amount) INTO v_highest FROM public.auction_bids WHERE listing_id = NEW.listing_id;

  IF NEW.amount <= COALESCE(v_highest, COALESCE(v_listing.start_price, v_listing.price, 0)) THEN
    RAISE EXCEPTION 'bid must be higher than the current price';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_auction_bid
BEFORE INSERT ON public.auction_bids
FOR EACH ROW
EXECUTE FUNCTION public.validate_auction_bid();

-- Realtime
ALTER TABLE public.auction_bids REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_bids;