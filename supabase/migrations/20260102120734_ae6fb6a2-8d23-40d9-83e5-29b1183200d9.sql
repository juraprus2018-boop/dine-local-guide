-- Drop the owner policy for ad placements - only admins should manage ads
DROP POLICY IF EXISTS "Owners can manage their ad placements" ON public.ad_placements;

-- Update: ads don't need to be linked to a restaurant anymore, admins place them globally
ALTER TABLE public.ad_placements ALTER COLUMN restaurant_id DROP NOT NULL;