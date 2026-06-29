-- 1) facebook_sync_meta: remove admin SELECT policy so webhook_secret is never readable via PostgREST.
DROP POLICY IF EXISTS "Admins can view sync meta" ON public.facebook_sync_meta;

-- 2) phone_accounts: add explicit owner-only SELECT policy to make intent clear.
DROP POLICY IF EXISTS "Users can view their own phone account" ON public.phone_accounts;
CREATE POLICY "Users can view their own phone account"
ON public.phone_accounts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3) restaurant_leads: add project_data size limit to the public INSERT policy.
DROP POLICY IF EXISTS "anyone can submit a lead" ON public.restaurant_leads;
CREATE POLICY "anyone can submit a lead"
ON public.restaurant_leads
FOR INSERT
WITH CHECK (
  (name IS NOT NULL)
  AND (char_length(name) >= 1) AND (char_length(name) <= 100)
  AND (whatsapp IS NOT NULL)
  AND (char_length(whatsapp) >= 5) AND (char_length(whatsapp) <= 20)
  AND (whatsapp ~ '^[0-9+()\-\s]+$'::text)
  AND (project_data IS NULL OR octet_length(project_data::text) < 65536)
);

-- 4) equipment_requests: contact info already restricted to owner/admin; no schema change needed.
