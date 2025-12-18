-- Add aptitudes tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS aptitudes jsonb DEFAULT '{"fuerza": 0, "potencia": 0, "agilidad": 0, "coordinacion": 0, "estabilidad": 0, "velocidad": 0, "resistencia": 0, "movilidad": 0}'::jsonb;

-- Update existing profiles with default aptitudes
UPDATE public.profiles 
SET aptitudes = '{"fuerza": 0, "potencia": 0, "agilidad": 0, "coordinacion": 0, "estabilidad": 0, "velocidad": 0, "resistencia": 0, "movilidad": 0}'::jsonb
WHERE aptitudes IS NULL;