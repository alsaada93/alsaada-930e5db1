CREATE TABLE public.phone_otps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  consumed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_phone_otps_phone ON public.phone_otps (phone, created_at DESC);

-- Only the server (service role) may read/write OTP rows. No anon/authenticated access.
GRANT ALL ON public.phone_otps TO service_role;

ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;
-- No policies: regular clients have zero access; the server uses the service role which bypasses RLS.