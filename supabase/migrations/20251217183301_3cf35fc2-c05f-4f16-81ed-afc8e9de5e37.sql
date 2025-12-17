-- Add duracion_semanas column for programs
ALTER TABLE public.routines 
ADD COLUMN IF NOT EXISTS duracion_semanas integer DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.routines.duracion_semanas IS 'Duration in weeks for programs (tipo=programa). NULL for routines.';