-- Create availability_settings table for global settings
CREATE TABLE public.availability_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'America/Santiago',
  meeting_duration_minutes integer NOT NULL DEFAULT 60,
  buffer_minutes integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(professional_id)
);

-- Create availability_exceptions table for blocking specific dates/times
CREATE TABLE public.availability_exceptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  exception_date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  all_day boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add calendar_event_id column to appointments if not exists
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS calendar_event_id text;

-- Add currency column to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'CLP';

-- Add payment_provider column to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS payment_provider text;

-- Enable RLS
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_exceptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for availability_settings
CREATE POLICY "Anyone can view availability settings"
ON public.availability_settings
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage availability settings"
ON public.availability_settings
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for availability_exceptions
CREATE POLICY "Anyone can view availability exceptions"
ON public.availability_exceptions
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage availability exceptions"
ON public.availability_exceptions
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger for updated_at on availability_settings
CREATE TRIGGER update_availability_settings_updated_at
BEFORE UPDATE ON public.availability_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster exception lookups
CREATE INDEX idx_availability_exceptions_date ON public.availability_exceptions(professional_id, exception_date);