-- Enable realtime for import_jobs table for live updates
ALTER TABLE public.import_jobs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.import_jobs;