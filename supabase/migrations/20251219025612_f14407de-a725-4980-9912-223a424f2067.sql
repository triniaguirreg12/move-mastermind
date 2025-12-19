-- Create table for user program enrollments
CREATE TABLE public.user_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  program_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  start_week INTEGER NOT NULL DEFAULT 1,
  current_week INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_programs ENABLE ROW LEVEL SECURITY;

-- Users can view their own enrollments
CREATE POLICY "Users can view their own program enrollments"
ON public.user_programs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can enroll themselves in programs
CREATE POLICY "Users can enroll in programs"
ON public.user_programs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own enrollments
CREATE POLICY "Users can update their own enrollments"
ON public.user_programs
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own enrollments
CREATE POLICY "Users can delete their own enrollments"
ON public.user_programs
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_programs_updated_at
  BEFORE UPDATE ON public.user_programs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();