-- Allow guests to upload to restaurant-photos bucket (foodwall folder)
CREATE POLICY "Anyone can upload to foodwall folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'restaurant-photos' 
  AND (storage.foldername(name))[1] = 'foodwall'
);