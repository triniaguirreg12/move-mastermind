-- Add assigned_user_id column to routines table for programs assigned to a specific user
ALTER TABLE public.routines 
ADD COLUMN assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_routines_assigned_user_id ON public.routines(assigned_user_id);

-- Update RLS policy to allow users to see programs assigned to them
DROP POLICY IF EXISTS "Anyone can view published routines" ON public.routines;

CREATE POLICY "Anyone can view published routines or assigned programs" 
ON public.routines 
FOR SELECT 
USING (
  (estado = 'publicada') OR 
  (assigned_user_id = auth.uid()) OR 
  (auth.uid() IS NOT NULL)
);