-- Remove the temporary view and definer-view issue
DROP VIEW IF EXISTS public.sellers_public;

-- Authenticated-only contact table for seller phone numbers
CREATE TABLE IF NOT EXISTS public.seller_contacts (
  seller_id text PRIMARY KEY REFERENCES public.sellers(id) ON DELETE CASCADE,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.seller_contacts TO authenticated;
GRANT ALL ON public.seller_contacts TO service_role;

ALTER TABLE public.seller_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seller contacts viewable by authenticated users"
  ON public.seller_contacts FOR SELECT
  TO authenticated
  USING (true);

-- Move existing phone data
INSERT INTO public.seller_contacts (seller_id, phone)
  SELECT id, phone FROM public.sellers WHERE phone IS NOT NULL
  ON CONFLICT (seller_id) DO UPDATE SET phone = EXCLUDED.phone;

-- Drop phone from the public sellers table
ALTER TABLE public.sellers DROP COLUMN IF EXISTS phone;

-- Restore public read on sellers (now safe, no phone)
DROP POLICY IF EXISTS "Sellers viewable by authenticated users" ON public.sellers;
CREATE POLICY "Sellers are viewable by everyone"
  ON public.sellers FOR SELECT
  USING (true);

CREATE TRIGGER update_seller_contacts_updated_at
  BEFORE UPDATE ON public.seller_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();