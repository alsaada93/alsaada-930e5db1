-- Deduplicate existing reviews: keep only the most recent per (seller_id, reviewer_id)
DELETE FROM public.seller_reviews a
USING public.seller_reviews b
WHERE a.seller_id = b.seller_id
  AND a.reviewer_id = b.reviewer_id
  AND a.created_at < b.created_at;

-- Enforce one review per reviewer per seller
ALTER TABLE public.seller_reviews
  ADD CONSTRAINT seller_reviews_one_per_reviewer UNIQUE (seller_id, reviewer_id);