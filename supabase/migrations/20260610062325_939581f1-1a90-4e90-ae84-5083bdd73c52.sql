DROP POLICY IF EXISTS "Owners can update their listings" ON public.listings;
CREATE POLICY "Owners can update their listings"
ON public.listings
FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (
  ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
  AND (has_role(auth.uid(), 'admin'::app_role) OR (status <> 'approved'::text))
);