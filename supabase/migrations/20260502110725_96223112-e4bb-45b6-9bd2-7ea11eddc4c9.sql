ALTER TABLE public.inspections REPLICA IDENTITY FULL;
ALTER TABLE public.settings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inspections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;