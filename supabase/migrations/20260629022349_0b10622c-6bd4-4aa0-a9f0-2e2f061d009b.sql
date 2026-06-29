DROP POLICY IF EXISTS "Authenticated users can read seller contacts" ON public.seller_contacts;
DROP POLICY IF EXISTS "seller_contacts_select" ON public.seller_contacts;
DROP POLICY IF EXISTS "Anyone authenticated can view seller contacts" ON public.seller_contacts;

CREATE POLICY "Admins can read seller contacts"
ON public.seller_contacts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_seller_phone(_seller_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT phone
  FROM public.seller_contacts
  WHERE seller_id::text = _seller_id
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_seller_phone(text) TO authenticated, anon;