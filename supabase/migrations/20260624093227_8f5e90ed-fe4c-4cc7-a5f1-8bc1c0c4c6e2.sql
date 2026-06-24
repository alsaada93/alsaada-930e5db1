-- Allow rating the owner of any listing (identified by their user id),
-- not only rows that exist in the legacy sellers table.
ALTER TABLE public.seller_reviews DROP CONSTRAINT IF EXISTS seller_reviews_seller_id_fkey;