-- Create page_views table for analytics
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL, -- 'restaurant', 'city', 'home'
  page_slug TEXT,
  ip_hash TEXT, -- Hashed IP for unique visitor tracking
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert page views
CREATE POLICY "Anyone can insert page views"
ON public.page_views
FOR INSERT
WITH CHECK (true);

-- Restaurant owners can view their restaurant page views
CREATE POLICY "Owners can view their restaurant page views"
ON public.page_views
FOR SELECT
USING (
  restaurant_id IS NOT NULL AND 
  owns_restaurant(auth.uid(), restaurant_id)
);

-- Admins can view all page views
CREATE POLICY "Admins can view all page views"
ON public.page_views
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_page_views_restaurant_id ON public.page_views(restaurant_id);
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at);

-- Create ad_placements table for Google Ads management
CREATE TABLE public.ad_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  placement_type TEXT NOT NULL, -- 'homepage', 'city', 'detail_sidebar', 'detail_content'
  ad_code TEXT, -- Google Ads code
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;

-- Owners can manage their own ad placements
CREATE POLICY "Owners can manage their ad placements"
ON public.ad_placements
FOR ALL
USING (owns_restaurant(auth.uid(), restaurant_id));

-- Admins can manage all ad placements
CREATE POLICY "Admins can manage all ad placements"
ON public.ad_placements
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Active ads are publicly readable for display
CREATE POLICY "Active ads are publicly readable"
ON public.ad_placements
FOR SELECT
USING (is_active = true AND (start_date IS NULL OR start_date <= CURRENT_DATE) AND (end_date IS NULL OR end_date >= CURRENT_DATE));

-- Add updated_at trigger
CREATE TRIGGER update_ad_placements_updated_at
BEFORE UPDATE ON public.ad_placements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();