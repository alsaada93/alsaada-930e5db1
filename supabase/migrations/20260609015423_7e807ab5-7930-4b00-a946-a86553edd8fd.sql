-- Add WITH CHECK to prevent non-admins from elevating their listing status to 'approved'
DROP POLICY IF EXISTS "Owners can update their listings" ON public.listings;
CREATE POLICY "Owners can update their listings"
  ON public.listings
  FOR UPDATE
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (
    (
      (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)
    )
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR status <> 'approved'
    )
  );

-- Republishing by a non-admin should require re-approval (go to 'pending' instead of 'approved')
CREATE OR REPLACE FUNCTION public.set_listing_expiry()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.published_at IS NULL THEN NEW.published_at := now(); END IF;
    NEW.expires_at := NEW.published_at + interval '60 days';
  ELSIF TG_OP = 'UPDATE' AND NEW.published_at IS DISTINCT FROM OLD.published_at THEN
    NEW.expires_at := NEW.published_at + interval '60 days';
    -- republishing reactivates an expired listing, but non-admins require re-approval
    IF NEW.status = 'expired' THEN
      IF has_role(auth.uid(), 'admin'::app_role) THEN
        NEW.status := 'approved';
      ELSE
        NEW.status := 'pending';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;