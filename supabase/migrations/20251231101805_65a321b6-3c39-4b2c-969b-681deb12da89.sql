-- Create table to track import jobs
CREATE TABLE public.import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  total_cities INTEGER NOT NULL DEFAULT 0,
  processed_cities INTEGER NOT NULL DEFAULT 0,
  imported_restaurants INTEGER NOT NULL DEFAULT 0,
  imported_reviews INTEGER NOT NULL DEFAULT 0,
  skipped_restaurants INTEGER NOT NULL DEFAULT 0,
  errors TEXT[] DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- Only admins can manage import jobs
CREATE POLICY "Admins can manage import jobs" 
ON public.import_jobs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_import_jobs_updated_at
BEFORE UPDATE ON public.import_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();