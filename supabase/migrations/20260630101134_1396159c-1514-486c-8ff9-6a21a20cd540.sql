DROP POLICY "Owners can update their listings" ON public.listings;

CREATE POLICY "Owners can update their listings"
ON public.listings
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() = user_id AND status <> 'approved'::text)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() = user_id AND status <> 'approved'::text)
);