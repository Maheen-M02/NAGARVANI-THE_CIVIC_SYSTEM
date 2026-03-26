-- SIMPLE Storage Policies for NagarVani (Development)
-- Run this in Supabase SQL Editor
-- This allows all authenticated users to upload/view files

-- ==================== COMPLAINT IMAGES ====================

-- Allow everyone to view
CREATE POLICY "Public read access for complaint images"
ON storage.objects FOR SELECT
USING (bucket_id = 'complaint-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload complaint images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'complaint-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete complaint images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'complaint-images' 
  AND auth.role() = 'authenticated'
);

-- ==================== PROFILE PICTURES ====================

-- Allow everyone to view
CREATE POLICY "Public read access for profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete profile pictures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
);

-- ==================== ATTACHMENTS ====================

-- Allow authenticated users to view
CREATE POLICY "Authenticated users can view attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments' 
  AND auth.role() = 'authenticated'
);

-- Success message
SELECT 'Simple storage policies created! All authenticated users can upload files.' as status;
