-- Update default price for appointments to $45.000 CLP
ALTER TABLE public.appointments ALTER COLUMN price_amount SET DEFAULT 45000;