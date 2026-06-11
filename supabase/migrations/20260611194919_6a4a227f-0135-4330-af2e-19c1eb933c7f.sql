DROP POLICY IF EXISTS "Requests viewable by authenticated users" ON public.equipment_requests;

CREATE POLICY "Requests viewable by owner and admins"
ON public.equipment_requests
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));