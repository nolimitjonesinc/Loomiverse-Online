-- Fix duplicate characters in loom_characters table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- Step 1: View duplicates (optional - just to see what will be deleted)
SELECT
    user_id,
    name,
    local_story_id,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY created_at DESC) as ids
FROM loom_characters
GROUP BY user_id, name, local_story_id
HAVING COUNT(*) > 1;

-- Step 2: Delete duplicates, keeping only the most recent
DELETE FROM loom_characters
WHERE id IN (
    SELECT id FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY user_id, name, local_story_id
                ORDER BY created_at DESC
            ) as rn
        FROM loom_characters
    ) sub
    WHERE rn > 1
);

-- Step 3: Add unique constraint to prevent future duplicates
ALTER TABLE loom_characters
DROP CONSTRAINT IF EXISTS loom_characters_user_name_story_unique;

ALTER TABLE loom_characters
ADD CONSTRAINT loom_characters_user_name_story_unique
UNIQUE (user_id, name, local_story_id);

-- Verify: Check for remaining duplicates (should return 0 rows)
SELECT
    user_id, name, local_story_id, COUNT(*)
FROM loom_characters
GROUP BY user_id, name, local_story_id
HAVING COUNT(*) > 1;
