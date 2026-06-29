-- 1) Listings: prevent self-approval on INSERT (mirror UPDATE restriction)
DROP POLICY IF EXISTS "Anyone can create a listing" ON public.listings;
CREATE POLICY "Anyone can create a listing"
  ON public.listings FOR INSERT
  WITH CHECK (
    (user_id IS NULL OR auth.uid() = user_id)
    AND (has_role(auth.uid(), 'admin'::app_role) OR status = 'pending')
  );

-- 2) Restaurant leads: validate input on INSERT to prevent spam/abuse
DROP POLICY IF EXISTS "anyone can submit a lead" ON public.restaurant_leads;
CREATE POLICY "anyone can submit a lead"
  ON public.restaurant_leads FOR INSERT
  WITH CHECK (
    name IS NOT NULL
    AND char_length(name) BETWEEN 1 AND 100
    AND whatsapp IS NOT NULL
    AND char_length(whatsapp) BETWEEN 5 AND 20
    AND whatsapp ~ '^[0-9+()\-\s]+$'
  );

-- 3) phone_otps: provide a secure cleanup mechanism for expired/consumed codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.phone_otps
  WHERE expires_at < now() OR consumed = true;
$$;