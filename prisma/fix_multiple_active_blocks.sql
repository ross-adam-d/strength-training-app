-- Fix existing data: Ensure only one active macrocycle per user
-- This script finds users with multiple active blocks and keeps only the most recent one

-- Step 1: Set all but the most recent active macrocycle to 'planned' for each user
UPDATE macrocycles
SET status = 'planned'
WHERE id IN (
  SELECT m.id
  FROM macrocycles m
  INNER JOIN (
    SELECT "userId", MAX("startDate") as max_date
    FROM macrocycles
    WHERE status = 'active'
    GROUP BY "userId"
    HAVING COUNT(*) > 1
  ) latest ON m."userId" = latest."userId"
  WHERE m.status = 'active'
    AND m."startDate" < latest.max_date
);

-- Step 2: Show summary of changes
SELECT
  "userId",
  COUNT(*) as active_count
FROM macrocycles
WHERE status = 'active'
GROUP BY "userId";
