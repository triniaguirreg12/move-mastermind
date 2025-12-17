-- Create table for scheduled routines
CREATE TABLE public.scheduled_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'programada' CHECK (status IN ('programada', 'completada', 'cancelada')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.scheduled_routines ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own scheduled routines" 
ON public.scheduled_routines 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled routines" 
ON public.scheduled_routines 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled routines" 
ON public.scheduled_routines 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled routines" 
ON public.scheduled_routines 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_scheduled_routines_updated_at
BEFORE UPDATE ON public.scheduled_routines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient queries
CREATE INDEX idx_scheduled_routines_user_id ON public.scheduled_routines(user_id);
CREATE INDEX idx_scheduled_routines_routine_id ON public.scheduled_routines(routine_id);
CREATE INDEX idx_scheduled_routines_date ON public.scheduled_routines(scheduled_date);