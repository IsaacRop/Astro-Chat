-- Usage limits table for freemium tracking
-- Tracks daily usage of AI-generated resources per user

CREATE TABLE IF NOT EXISTS usage_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_type text NOT NULL CHECK (resource_type IN ('exam', 'flashcard', 'chat')),
    usage_date date NOT NULL DEFAULT current_date,
    usage_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, resource_type, usage_date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_date
    ON usage_limits (user_id, resource_type, usage_date);

-- Enable RLS
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

-- Users can only read their own usage records
CREATE POLICY "Users can read own usage"
    ON usage_limits FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own usage records
CREATE POLICY "Users can insert own usage"
    ON usage_limits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage records
CREATE POLICY "Users can update own usage"
    ON usage_limits FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
