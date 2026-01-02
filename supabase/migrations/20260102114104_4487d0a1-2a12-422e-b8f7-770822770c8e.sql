-- Make user_id nullable for guest review photos
ALTER TABLE public.review_photos 
ALTER COLUMN user_id DROP NOT NULL;

-- Add guest_email for tracking guest photo uploads
ALTER TABLE public.review_photos 
ADD COLUMN guest_email text;

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can add photos to their reviews" ON public.review_photos;

-- Create new policy that allows guest photo uploads
CREATE POLICY "Anyone can add photos to reviews" 
ON public.review_photos 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND guest_email IS NOT NULL)
);

-- Update DELETE policy to include guests
DROP POLICY IF EXISTS "Users can delete their own review photos" ON public.review_photos;

CREATE POLICY "Users can delete their own review photos" 
ON public.review_photos 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR
  (user_id IS NULL)
);

-- Allow guest uploads to reviews folder in storage
CREATE POLICY "Anyone can upload to reviews folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'restaurant-photos' 
  AND (storage.foldername(name))[1] = 'reviews'
);