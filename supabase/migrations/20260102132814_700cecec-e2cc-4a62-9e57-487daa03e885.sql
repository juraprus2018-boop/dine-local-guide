-- Create table to track photo refresh progress
CREATE TABLE public.photo_refresh_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status text NOT NULL DEFAULT 'pending',
  total_restaurants integer NOT NULL DEFAULT 0,
  processed_restaurants integer NOT NULL DEFAULT 0,
  photos_downloaded integer NOT NULL DEFAULT 0,
  last_restaurant_id uuid REFERENCES public.restaurants(id),
  last_restaurant_name text,
  completed_restaurants jsonb NOT NULL DEFAULT '[]'::jsonb,
  errors text[] DEFAULT '{}'::text[],
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.photo_refresh_jobs ENABLE ROW LEVEL SECURITY;

-- Admin only access
CREATE POLICY "Admins can manage photo refresh jobs" 
ON public.photo_refresh_jobs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.photo_refresh_jobs;

-- Update trigger
CREATE TRIGGER update_photo_refresh_jobs_updated_at
BEFORE UPDATE ON public.photo_refresh_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();