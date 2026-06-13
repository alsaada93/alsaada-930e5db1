ALTER TABLE public.restaurant_equipment
  ADD COLUMN IF NOT EXISTS price_new_discounted numeric(12,2);