-- Storage Buckets Setup
-- Run this in Supabase SQL Editor or create manually in dashboard

-- Create storage buckets for uploaded assets and generated images
-- Note: This needs to be done via Supabase Dashboard > Storage > New Bucket

-- Bucket 1: 'assets' - For user uploaded images
-- Settings:
--   - Public: true (to serve images)
--   - File size limit: 10MB
--   - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- Bucket 2: 'generated' - For AI generated images  
-- Settings:
--   - Public: true (to serve images)
--   - File size limit: 20MB
--   - Allowed MIME types: image/png, image/jpeg, image/webp

-- Added executable storage policies (uncommented)
-- After creating buckets in Dashboard, run these policies:

-- For 'assets' bucket:
CREATE POLICY "Public read access for assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'assets');

CREATE POLICY "Service role insert for assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Allow asset updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'assets');

-- For 'generated' bucket:
CREATE POLICY "Public read access for generated"
ON storage.objects FOR SELECT  
USING (bucket_id = 'generated');

CREATE POLICY "Service role insert for generated"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated');

CREATE POLICY "Allow generated updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'generated');
