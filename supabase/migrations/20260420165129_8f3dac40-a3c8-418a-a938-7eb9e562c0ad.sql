
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Settings (singleton row id=1)
CREATE TABLE public.settings (
  id INT PRIMARY KEY DEFAULT 1,
  visit_date DATE,
  time_slots TEXT[] NOT NULL DEFAULT ARRAY['08:00-09:00','09:00-10:00','10:00-11:00','11:00-12:00','14:00-15:00','15:00-16:00','16:00-17:00'],
  contact_phone TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);
INSERT INTO public.settings (id) VALUES (1);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can update settings" ON public.settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert settings" ON public.settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Inspections
CREATE TYPE public.exhaust_status AS ENUM ('working', 'not_working', 'untested');

CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tower SMALLINT NOT NULL CHECK (tower BETWEEN 1 AND 10),
  apartment SMALLINT NOT NULL CHECK (apartment BETWEEN 101 AND 808),
  resident_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status exhaust_status NOT NULL,
  time_slot TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tower, apartment)
);
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit inspection" ON public.inspections
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view own apt by query" ON public.inspections
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can update" ON public.inspections
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete" ON public.inspections
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
