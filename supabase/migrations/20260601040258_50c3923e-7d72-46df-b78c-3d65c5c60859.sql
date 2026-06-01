-- 1. Equipment requests: stop exposing contact phone numbers to anonymous visitors.
DROP POLICY IF EXISTS "Open requests are viewable by everyone" ON public.equipment_requests;

CREATE POLICY "Requests viewable by authenticated users"
ON public.equipment_requests
FOR SELECT
TO authenticated
USING (
  (status = 'open') OR (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)
);

REVOKE SELECT ON public.equipment_requests FROM anon;

-- 2. Allow owners/admins to remove or replace uploaded listing media (previously impossible).
CREATE POLICY "Admins can update listing media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'listings' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete listing media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'listings' AND has_role(auth.uid(), 'admin'::app_role));