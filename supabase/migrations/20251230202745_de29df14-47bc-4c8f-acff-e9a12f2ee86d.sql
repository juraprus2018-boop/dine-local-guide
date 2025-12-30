-- Create storage bucket for restaurant photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-photos', 'restaurant-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'restaurant-photos');

-- Allow public to view photos
CREATE POLICY "Anyone can view restaurant photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'restaurant-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'restaurant-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to manage all photos
CREATE POLICY "Admins can manage all photos in storage"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'restaurant-photos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);