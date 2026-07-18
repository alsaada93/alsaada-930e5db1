DROP VIEW IF EXISTS public.seller_reviews_public;

REVOKE SELECT ON public.seller_reviews FROM anon;
REVOKE SELECT ON public.seller_reviews FROM authenticated;
GRANT SELECT (id, seller_id, rating, comment, created_at) ON public.seller_reviews TO anon;
GRANT SELECT (id, seller_id, rating, comment, created_at, reviewer_id) ON public.seller_reviews TO authenticated;

DROP POLICY IF EXISTS "Public columns of reviews are readable" ON public.seller_reviews;
CREATE POLICY "Public columns of reviews are readable"
ON public.seller_reviews FOR SELECT
TO anon, authenticated
USING (true);

CREATE VIEW public.seller_reviews_public
WITH (security_invoker = on) AS
SELECT id, seller_id, rating, comment, created_at
FROM public.seller_reviews;

GRANT SELECT ON public.seller_reviews_public TO anon, authenticated;