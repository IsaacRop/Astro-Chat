-- Migrate usage_limits from daily date-based windows to 5-hour rolling windows

-- Step 1: Add reset_at column (nullable initially for migration)
ALTER TABLE usage_limits
    ADD COLUMN IF NOT EXISTS reset_at timestamptz;

-- Step 2: Deduplicate rows — for each (user_id, resource_type) pair keep only the
-- row with the most recent created_at (i.e. the current active record)
DELETE FROM usage_limits a
USING usage_limits b
WHERE a.user_id = b.user_id
  AND a.resource_type = b.resource_type
  AND a.created_at < b.created_at;

-- Step 3: Seed reset_at for surviving rows
-- Today's records: give them a 5-hour window from now
UPDATE usage_limits
SET reset_at = NOW() + INTERVAL '5 hours'
WHERE usage_date = CURRENT_DATE
  AND reset_at IS NULL;

-- Older records: mark as already expired
UPDATE usage_limits
SET reset_at = NOW() - INTERVAL '1 second'
WHERE usage_date < CURRENT_DATE
  AND reset_at IS NULL;

-- Step 4: Make the column NOT NULL (all rows now have a value)
ALTER TABLE usage_limits
    ALTER COLUMN reset_at SET NOT NULL;

-- Step 5: Drop the old date-keyed unique constraint
ALTER TABLE usage_limits
    DROP CONSTRAINT IF EXISTS usage_limits_user_id_resource_type_usage_date_key;

-- Step 6: Add the new per-user-per-resource unique constraint
--         (only one active record per user/resource at a time)
ALTER TABLE usage_limits
    ADD CONSTRAINT usage_limits_user_id_resource_type_key
    UNIQUE (user_id, resource_type);

-- Step 7: Replace the old index (which keyed on usage_date) with a new one
DROP INDEX IF EXISTS idx_usage_limits_user_date;
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_resource
    ON usage_limits (user_id, resource_type);
