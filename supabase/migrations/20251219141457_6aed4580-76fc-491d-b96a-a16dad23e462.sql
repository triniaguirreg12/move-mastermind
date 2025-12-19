-- Create professionals table
CREATE TABLE public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL,
  specialty text,
  description text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create professional availability slots table
CREATE TABLE public.professional_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_duration_minutes integer NOT NULL DEFAULT 60,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create appointments table with form data
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'confirmed', 'cancelled', 'completed')),
  -- Form data
  consultation_goal text NOT NULL,
  injury_condition text NOT NULL,
  available_equipment text[] DEFAULT '{}',
  additional_comments text,
  -- Payment info
  price_amount integer NOT NULL DEFAULT 35000,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_id text,
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_professional_id ON public.appointments(professional_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_professional_availability_professional ON public.professional_availability(professional_id);

-- Enable RLS
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Professionals policies (public read, admin write)
CREATE POLICY "Anyone can view active professionals"
ON public.professionals FOR SELECT
USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage professionals"
ON public.professionals FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Availability policies
CREATE POLICY "Anyone can view active availability"
ON public.professional_availability FOR SELECT
USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage availability"
ON public.professional_availability FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Appointments policies
CREATE POLICY "Users can view their own appointments"
ON public.appointments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments"
ON public.appointments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
ON public.appointments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments"
ON public.appointments FOR DELETE
USING (auth.uid() = user_id);

-- Admin policy to view all appointments
CREATE POLICY "Authenticated users can view all appointments for admin"
ON public.appointments FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_professionals_updated_at
BEFORE UPDATE ON public.professionals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert Isabel Rencoret as the first professional
INSERT INTO public.professionals (name, title, specialty, description)
VALUES (
  'Isabel Rencoret',
  'Kinesióloga Deportiva',
  'Especialista en entrenamiento funcional, prevención de lesiones y pádel.',
  'Isabel cuenta con más de 7 años de experiencia en kinesiología deportiva, ayudando a atletas y deportistas a alcanzar su máximo rendimiento.'
);

-- Insert default availability for Isabel (Monday to Friday, 9am-6pm)
INSERT INTO public.professional_availability (professional_id, day_of_week, start_time, end_time, slot_duration_minutes)
SELECT 
  p.id,
  day_num,
  '09:00'::time,
  '18:00'::time,
  60
FROM public.professionals p
CROSS JOIN generate_series(1, 5) AS day_num
WHERE p.name = 'Isabel Rencoret';