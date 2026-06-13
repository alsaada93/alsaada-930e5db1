DROP POLICY IF EXISTS "events insert by anyone" ON public.restaurant_calc_events;
CREATE POLICY "events insert by anyone"
  ON public.restaurant_calc_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    total_price >= 0
    AND total_price < 1000000000
    AND (product_slug IS NULL OR char_length(product_slug) <= 200)
    AND (product_name IS NULL OR char_length(product_name) <= 200)
  );

DROP POLICY IF EXISTS "Anyone can upload listing media" ON storage.objects;
CREATE POLICY "Anyone can upload listing media"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'listings'
    AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','gif','avif')
  );