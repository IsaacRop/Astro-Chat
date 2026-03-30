-- Paywall / Usage-limit columns for the profiles table
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_message_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_message_date   date;

-- Ensure plan_tier defaults to 'free' for all new rows
ALTER TABLE public.profiles
  ALTER COLUMN plan_tier SET DEFAULT 'free';

-- Back-fill any existing rows that have no plan set
UPDATE public.profiles
SET plan_tier = 'free'
WHERE plan_tier IS NULL;
