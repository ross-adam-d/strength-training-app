-- Check how many active blocks each user has
SELECT
  "userId",
  COUNT(*) as active_count,
  STRING_AGG(id, ', ') as block_ids,
  STRING_AGG("name", ', ') as block_names
FROM macrocycles
WHERE status = 'active'
GROUP BY "userId"
ORDER BY active_count DESC;
