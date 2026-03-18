-- Add login streak tracking columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS login_streak integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_date date;
