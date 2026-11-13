DROP POLICY IF EXISTS "Anyone can upload listing media" ON storage.objects;
CREATE POLICY "Signed-in users upload own listing media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'listings'
  AND owner_id = (select auth.uid()::text)
  AND lower(storage.extension(name)) = ANY (ARRAY['jpg','jpeg','png','webp','gif','avif','mp4','webm','mov'])
);