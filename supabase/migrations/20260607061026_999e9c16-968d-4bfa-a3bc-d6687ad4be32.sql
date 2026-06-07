DROP POLICY IF EXISTS "Owners can delete their requests" ON public.equipment_requests;
DROP POLICY IF EXISTS "Owners can update their requests" ON public.equipment_requests;

CREATE POLICY "Owners can delete their requests"
ON public.equipment_requests
FOR DELETE
TO authenticated
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can update their requests"
ON public.equipment_requests
FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));