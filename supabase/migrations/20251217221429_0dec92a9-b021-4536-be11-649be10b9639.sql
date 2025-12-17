-- Add weekly training goal column to profiles
ALTER TABLE public.profiles 
ADD COLUMN weekly_training_goal integer NOT NULL DEFAULT 4;

-- Add constraint to ensure goal is between 1 and 7
ALTER TABLE public.profiles 
ADD CONSTRAINT weekly_training_goal_range 
CHECK (weekly_training_goal >= 1 AND weekly_training_goal <= 7);