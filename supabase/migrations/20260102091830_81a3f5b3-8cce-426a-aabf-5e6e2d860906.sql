-- Create food_posts table for the foodwall feature
CREATE TABLE public.food_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create food_post_likes table for tracking likes
CREATE TABLE public.food_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.food_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create review_photos table for photos attached to reviews
CREATE TABLE public.review_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.food_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;

-- Food posts policies
CREATE POLICY "Food posts are publicly readable"
  ON public.food_posts
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create food posts"
  ON public.food_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food posts"
  ON public.food_posts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food posts"
  ON public.food_posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Food post likes policies
CREATE POLICY "Likes are publicly readable"
  ON public.food_post_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like posts"
  ON public.food_post_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.food_post_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Review photos policies
CREATE POLICY "Review photos are publicly readable"
  ON public.review_photos
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add photos to their reviews"
  ON public.review_photos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review photos"
  ON public.review_photos
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.update_food_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.food_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.food_posts
    SET likes_count = likes_count - 1
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for likes count
CREATE TRIGGER on_food_post_like_change
  AFTER INSERT OR DELETE ON public.food_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_food_post_likes_count();

-- Trigger for updated_at on food_posts
CREATE TRIGGER update_food_posts_updated_at
  BEFORE UPDATE ON public.food_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();