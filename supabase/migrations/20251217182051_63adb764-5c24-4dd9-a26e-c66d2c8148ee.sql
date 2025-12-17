-- Add tipo column to distinguish routines from programs
ALTER TABLE public.routines 
ADD COLUMN tipo text NOT NULL DEFAULT 'rutina' 
CHECK (tipo IN ('rutina', 'programa'));

-- Add index for tipo queries
CREATE INDEX idx_routines_tipo ON public.routines(tipo);

-- Update existing routines to be type 'rutina'
UPDATE public.routines SET tipo = 'rutina' WHERE tipo IS NULL;