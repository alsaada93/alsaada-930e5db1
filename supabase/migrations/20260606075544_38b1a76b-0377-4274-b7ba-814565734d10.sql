ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS old_price numeric;
ALTER TABLE public.listings ALTER COLUMN status SET DEFAULT 'pending';