-- Add Stripe subscription columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id   text,
  ADD COLUMN IF NOT EXISTS subscription_status  text,
  ADD COLUMN IF NOT EXISTS current_period_end   timestamptz;
