-- 1. Phone -> auth account mapping, written ONLY by the service role (RLS, no policies).
CREATE TABLE IF NOT EXISTS public.phone_accounts (
  phone text PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.phone_accounts ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.phone_accounts TO service_role;

-- Backfill from already-verified profiles
INSERT INTO public.phone_accounts (phone, user_id)
SELECT phone, id FROM public.profiles
WHERE phone IS NOT NULL AND verified = true
ON CONFLICT (phone) DO NOTHING;

-- 2. Restrict listing deletion to authenticated users / admins
DROP POLICY IF EXISTS "Owners can delete their listings" ON public.listings;
CREATE POLICY "Owners can delete their listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

-- 3. Pin search_path on the pgmq helper functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;