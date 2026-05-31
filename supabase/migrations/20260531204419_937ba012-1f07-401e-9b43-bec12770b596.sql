CREATE TABLE public.equipment_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  title text NOT NULL,
  description text,
  images text[] NOT NULL DEFAULT '{}'::text[],
  category_id text,
  city text,
  budget numeric,
  contact_name text,
  contact_phone text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.equipment_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_requests TO authenticated;
GRANT ALL ON public.equipment_requests TO service_role;

ALTER TABLE public.equipment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open requests are viewable by everyone"
ON public.equipment_requests
FOR SELECT
USING ((status = 'open') OR (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can create a request"
ON public.equipment_requests
FOR INSERT
WITH CHECK ((user_id IS NULL) OR (auth.uid() = user_id));

CREATE POLICY "Owners can update their requests"
ON public.equipment_requests
FOR UPDATE
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can delete their requests"
ON public.equipment_requests
FOR DELETE
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_equipment_requests_updated_at
BEFORE UPDATE ON public.equipment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();