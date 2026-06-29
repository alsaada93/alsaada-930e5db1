ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS model_year integer,
  ADD COLUMN IF NOT EXISTS mileage integer,
  ADD COLUMN IF NOT EXISTS engine_capacity text,
  ADD COLUMN IF NOT EXISTS car_make text;