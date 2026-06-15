-- ============ facebook_ads ============
CREATE TABLE public.facebook_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fb_post_id text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'إعلان',
  description text,
  seller_name text,
  phone text,
  category text NOT NULL DEFAULT 'other',
  images text[] NOT NULL DEFAULT '{}',
  thumbnails text[] NOT NULL DEFAULT '{}',
  raw_text text,
  fb_published_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.facebook_ads TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.facebook_ads TO authenticated;
GRANT ALL ON public.facebook_ads TO service_role;

ALTER TABLE public.facebook_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active facebook ads"
  ON public.facebook_ads FOR SELECT
  USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage facebook ads"
  ON public.facebook_ads FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_facebook_ads_status ON public.facebook_ads (status);
CREATE INDEX idx_facebook_ads_category ON public.facebook_ads (category);
CREATE INDEX idx_facebook_ads_published ON public.facebook_ads (fb_published_at DESC);

-- ============ facebook_sync_logs ============
CREATE TABLE public.facebook_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  fb_post_id text,
  status text NOT NULL DEFAULT 'success',
  message text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.facebook_sync_logs TO authenticated;
GRANT ALL ON public.facebook_sync_logs TO service_role;

ALTER TABLE public.facebook_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync logs"
  ON public.facebook_sync_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_fb_sync_logs_created ON public.facebook_sync_logs (created_at DESC);
CREATE INDEX idx_fb_sync_logs_status ON public.facebook_sync_logs (status);

-- ============ facebook_sync_meta ============
CREATE TABLE public.facebook_sync_meta (
  id integer PRIMARY KEY DEFAULT 1,
  webhook_secret text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  last_sync_at timestamptz,
  api_status text NOT NULL DEFAULT 'idle',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT facebook_sync_meta_singleton CHECK (id = 1)
);

GRANT SELECT ON public.facebook_sync_meta TO authenticated;
GRANT ALL ON public.facebook_sync_meta TO service_role;

ALTER TABLE public.facebook_sync_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync meta"
  ON public.facebook_sync_meta FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.facebook_sync_meta (id) VALUES (1) ON CONFLICT DO NOTHING;

-- updated_at triggers
CREATE TRIGGER trg_facebook_ads_updated
  BEFORE UPDATE ON public.facebook_ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_facebook_sync_meta_updated
  BEFORE UPDATE ON public.facebook_sync_meta
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();