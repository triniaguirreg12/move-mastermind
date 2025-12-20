-- Create a partial unique index to ensure only one active program per user at a time
-- This prevents users from having multiple active programs simultaneously
CREATE UNIQUE INDEX idx_user_programs_one_active_per_user 
ON user_programs (user_id) 
WHERE status = 'active';