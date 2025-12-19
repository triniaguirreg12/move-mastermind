-- Table for program weeks
CREATE TABLE public.program_weeks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for routines within program weeks (with optional custom data for edits)
CREATE TABLE public.program_week_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID NOT NULL REFERENCES public.program_weeks(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL DEFAULT 0,
  custom_data JSONB NULL, -- Stores customized routine data when edited within program
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.program_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_week_routines ENABLE ROW LEVEL SECURITY;

-- RLS policies for program_weeks
CREATE POLICY "Anyone can view program weeks"
ON public.program_weeks
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage program weeks"
ON public.program_weeks
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for program_week_routines
CREATE POLICY "Anyone can view program week routines"
ON public.program_week_routines
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage program week routines"
ON public.program_week_routines
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX idx_program_weeks_program_id ON public.program_weeks(program_id);
CREATE INDEX idx_program_week_routines_week_id ON public.program_week_routines(week_id);