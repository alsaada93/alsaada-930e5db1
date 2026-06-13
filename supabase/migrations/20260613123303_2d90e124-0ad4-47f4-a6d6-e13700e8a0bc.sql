-- Restrict direct reads of the sellers table (which contains phone numbers) to authenticated users
DROP POLICY IF EXISTS "Sellers are viewable by everyone" ON public.sellers;

CREATE POLICY "Sellers viewable by authenticated users"
  ON public.sellers FOR SELECT
  TO authenticated
  USING (true);

-- Public-safe view exposing seller info WITHOUT phone numbers, readable by everyone
CREATE OR REPLACE VIEW public.sellers_public AS
  SELECT id, name, verified, rating, reviews_count, deals_count, city, member_since
  FROM public.sellers;

GRANT SELECT ON public.sellers_public TO anon, authenticated;