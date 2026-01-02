-- Add guest_email for foodwall guest posts
ALTER TABLE public.food_posts 
ADD COLUMN guest_email text;

-- Update the insert policy to require email for guests
DROP POLICY IF EXISTS "Anyone can create food posts" ON public.food_posts;

CREATE POLICY "Anyone can create food posts" 
ON public.food_posts 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND guest_name IS NOT NULL AND guest_email IS NOT NULL)
);