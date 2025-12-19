-- Agregar columna google_meet_link a appointments
ALTER TABLE public.appointments
ADD COLUMN google_meet_link TEXT;

-- Agregar status 'missed' para citas no realizadas
COMMENT ON COLUMN public.appointments.status IS 'Status: pending_payment, confirmed, completed, missed, cancelled';