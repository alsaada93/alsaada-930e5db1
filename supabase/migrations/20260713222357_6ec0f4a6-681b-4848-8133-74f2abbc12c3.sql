-- Restrict auction_bids SELECT to authenticated users to avoid exposing bidder identities publicly
DROP POLICY IF EXISTS "Bids are viewable by everyone" ON public.auction_bids;
CREATE POLICY "Bids are viewable by authenticated users"
  ON public.auction_bids
  FOR SELECT
  TO authenticated
  USING (true);

-- Restrict user_follows SELECT to authenticated users to avoid exposing the social graph publicly
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.user_follows;
CREATE POLICY "Follows are viewable by authenticated users"
  ON public.user_follows
  FOR SELECT
  TO authenticated
  USING (true);