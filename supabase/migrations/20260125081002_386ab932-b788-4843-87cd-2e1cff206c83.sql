-- Add source column to reviews table
ALTER TABLE public.reviews 
ADD COLUMN source text NOT NULL DEFAULT 'website';

-- Update existing reviews: mark reviews without user_id and without guest_email as 'google_import'
UPDATE public.reviews 
SET source = 'google_import' 
WHERE user_id IS NULL AND guest_email IS NULL;

-- Update the trigger function to only count website reviews
CREATE OR REPLACE FUNCTION public.update_restaurant_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.restaurants
  SET 
    rating = (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE restaurant_id = COALESCE(NEW.restaurant_id, OLD.restaurant_id) AND is_approved = true AND source = 'website'),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE restaurant_id = COALESCE(NEW.restaurant_id, OLD.restaurant_id) AND is_approved = true AND source = 'website'),
    updated_at = now()
  WHERE id = COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recalculate all restaurant ratings based only on website reviews
UPDATE public.restaurants r
SET 
  rating = COALESCE((
    SELECT AVG(rev.rating) 
    FROM public.reviews rev 
    WHERE rev.restaurant_id = r.id 
    AND rev.is_approved = true 
    AND rev.source = 'website'
  ), 0),
  review_count = (
    SELECT COUNT(*) 
    FROM public.reviews rev 
    WHERE rev.restaurant_id = r.id 
    AND rev.is_approved = true 
    AND rev.source = 'website'
  ),
  updated_at = now();