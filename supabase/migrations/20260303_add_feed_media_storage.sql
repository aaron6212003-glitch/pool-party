-- 1. Create a public bucket for Feed Media (Gifs/Photos)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('feed_media', 'feed_media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow Public to see uploaded media
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'feed_media' );

-- 3. Allow Authenticated users to upload media
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'feed_media' 
  AND auth.role() = 'authenticated'
);

-- 4. Allow users to delete their own media
CREATE POLICY "User Deletion"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'feed_media' 
  AND auth.uid() = owner
);
