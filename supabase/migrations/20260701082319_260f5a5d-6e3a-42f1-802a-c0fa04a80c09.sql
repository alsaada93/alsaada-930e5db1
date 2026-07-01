-- Harden facebook_sync_meta: ensure the webhook secret is never readable by client roles.
REVOKE ALL ON public.facebook_sync_meta FROM anon, authenticated;
GRANT ALL ON public.facebook_sync_meta TO service_role;
-- Explicit deny policy documenting intent (RLS already fail-closed with no policies).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'facebook_sync_meta' AND policyname = 'No client access to sync meta'
  ) THEN
    EXECUTE 'CREATE POLICY "No client access to sync meta" ON public.facebook_sync_meta FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)';
  END IF;
END $$;