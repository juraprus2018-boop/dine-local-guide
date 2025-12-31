-- Change default is_approved to false for moderation workflow
ALTER TABLE public.reviews ALTER COLUMN is_approved SET DEFAULT false;