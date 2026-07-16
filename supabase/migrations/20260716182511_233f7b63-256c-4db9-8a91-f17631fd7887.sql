
DROP POLICY IF EXISTS "Bids are viewable by authenticated users" ON public.auction_bids;
CREATE POLICY "Bids visible to bidder or listing owner"
ON public.auction_bids FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.listings l WHERE l.id = auction_bids.listing_id AND l.user_id = auth.uid())
);

CREATE OR REPLACE FUNCTION public.get_auction_stats(_listing_ids uuid[])
RETURNS TABLE(listing_id uuid, highest numeric, bids bigint, bidders bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.listing_id, COALESCE(MAX(b.amount), 0)::numeric, COUNT(*)::bigint, COUNT(DISTINCT b.user_id)::bigint
  FROM public.auction_bids b WHERE b.listing_id = ANY(_listing_ids) GROUP BY b.listing_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_auction_stats(uuid[]) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_auction_recent_bids(_listing_id uuid, _limit int DEFAULT 5)
RETURNS TABLE(id uuid, amount numeric, created_at timestamptz, is_self boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.id, b.amount, b.created_at, (b.user_id = auth.uid())
  FROM public.auction_bids b WHERE b.listing_id = _listing_id ORDER BY b.amount DESC LIMIT COALESCE(_limit, 5);
$$;
GRANT EXECUTE ON FUNCTION public.get_auction_recent_bids(uuid, int) TO anon, authenticated;

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.seller_reviews;
CREATE POLICY "Reviews raw visible to reviewer or seller"
ON public.seller_reviews FOR SELECT TO authenticated
USING (auth.uid() = reviewer_id OR auth.uid()::text = seller_id);

CREATE OR REPLACE VIEW public.seller_reviews_public
WITH (security_invoker = off) AS
SELECT id, seller_id, rating, comment, created_at FROM public.seller_reviews;
GRANT SELECT ON public.seller_reviews_public TO anon, authenticated;

DROP POLICY IF EXISTS "Follows are viewable by authenticated users" ON public.user_follows;
CREATE POLICY "Follows visible to involved users"
ON public.user_follows FOR SELECT TO authenticated
USING (auth.uid() = follower_id OR auth.uid() = following_id);
