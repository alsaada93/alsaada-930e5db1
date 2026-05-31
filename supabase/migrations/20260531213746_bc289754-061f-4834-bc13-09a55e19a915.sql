-- 60-day listing lifecycle: publish + expiry timestamps and auto-hide automation

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS published_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 days');

-- Backfill existing rows based on creation date
UPDATE public.listings
  SET published_at = created_at,
      expires_at = created_at + interval '60 days'
  WHERE expires_at IS NULL OR expires_at = published_at;

-- Keep expires_at in sync whenever published_at changes (publish / repost)
CREATE OR REPLACE FUNCTION public.set_listing_expiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.published_at IS NULL THEN NEW.published_at := now(); END IF;
    NEW.expires_at := NEW.published_at + interval '60 days';
  ELSIF TG_OP = 'UPDATE' AND NEW.published_at IS DISTINCT FROM OLD.published_at THEN
    NEW.expires_at := NEW.published_at + interval '60 days';
    -- republishing reactivates an expired listing
    IF NEW.status = 'expired' THEN NEW.status := 'approved'; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_listing_expiry ON public.listings;
CREATE TRIGGER trg_set_listing_expiry
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_listing_expiry();

-- Automation: hide expired listings (run hourly via pg_cron)
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.expire_old_listings()
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE public.listings
     SET status = 'expired'
   WHERE status = 'approved'
     AND expires_at < now();
$$;

SELECT cron.unschedule('expire-old-listings')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-old-listings');

SELECT cron.schedule(
  'expire-old-listings',
  '0 * * * *',
  $$ SELECT public.expire_old_listings(); $$
);