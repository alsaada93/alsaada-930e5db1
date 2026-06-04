-- Visitor tracking table for admin analytics
CREATE TABLE public.site_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country text,
  browser text,
  path text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_visits TO authenticated;
GRANT ALL ON public.site_visits TO service_role;

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Only admins can read visit analytics
CREATE POLICY "Admins can view site visits"
  ON public.site_visits FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_site_visits_created_at ON public.site_visits (created_at);
CREATE INDEX idx_site_visits_country ON public.site_visits (country);
CREATE INDEX idx_site_visits_browser ON public.site_visits (browser);

-- Security fix: reject email addresses inside listings.contact_name
CREATE OR REPLACE FUNCTION public.reject_email_in_contact_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.contact_name IS NOT NULL
     AND NEW.contact_name ~* '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' THEN
    RAISE EXCEPTION 'contact_name must not contain an email address';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reject_email_in_contact_name
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.reject_email_in_contact_name();