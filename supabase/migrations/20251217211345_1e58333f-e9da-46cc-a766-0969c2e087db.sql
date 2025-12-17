-- Create unified user_events table for all event types
CREATE TABLE public.user_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrenamiento', 'padel', 'profesional')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed')),
  event_date DATE NOT NULL,
  time_start TIME,
  time_end TIME,
  title TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_events
CREATE POLICY "Users can view their own events"
ON public.user_events
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events"
ON public.user_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
ON public.user_events
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
ON public.user_events
FOR DELETE
USING (auth.uid() = user_id);

-- Index for efficient queries
CREATE INDEX idx_user_events_user_date ON public.user_events(user_id, event_date);
CREATE INDEX idx_user_events_type ON public.user_events(type);
CREATE INDEX idx_user_events_status ON public.user_events(status);

-- Trigger for updated_at
CREATE TRIGGER update_user_events_updated_at
BEFORE UPDATE ON public.user_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();