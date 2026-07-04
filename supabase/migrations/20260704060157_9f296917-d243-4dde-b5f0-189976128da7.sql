ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS is_offer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sold boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS listings_is_offer_idx ON public.listings (is_offer) WHERE is_offer = true;

-- Harden creation: only admins may create special-offer listings.
DROP POLICY IF EXISTS "Anyone can create a listing" ON public.listings;
CREATE POLICY "Anyone can create a listing" ON public.listings
  FOR INSERT
  TO public
  WITH CHECK (
    ((user_id IS NULL) OR (auth.uid() = user_id))
    AND (has_role(auth.uid(), 'admin'::app_role) OR (status = 'pending'::text))
    AND (has_role(auth.uid(), 'admin'::app_role) OR (is_offer = false))
  );