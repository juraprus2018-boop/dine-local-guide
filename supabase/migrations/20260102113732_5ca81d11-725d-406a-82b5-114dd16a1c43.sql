-- Make user_id nullable for guest posts
ALTER TABLE public.food_posts 
ALTER COLUMN user_id DROP NOT NULL;

-- Add guest_name for anonymous posters
ALTER TABLE public.food_posts 
ADD COLUMN guest_name text;

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create food posts" ON public.food_posts;

-- Create new policy that allows guest posts
CREATE POLICY "Anyone can create food posts" 
ON public.food_posts 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND guest_name IS NOT NULL)
);