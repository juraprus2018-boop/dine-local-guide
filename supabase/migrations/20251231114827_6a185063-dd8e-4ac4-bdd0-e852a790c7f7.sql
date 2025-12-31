-- Add last_city column to import_jobs for better status tracking
ALTER TABLE public.import_jobs 
ADD COLUMN IF NOT EXISTS last_city TEXT DEFAULT NULL;