-- Migration: Add unique constraint for active macrocycles
-- Ensures only one active training block per user
-- Run this manually after deploying the code changes:
--
-- For local:
--   psql $DATABASE_URL -f prisma/migrations/add_unique_active_macrocycle.sql
--
-- For production (Supabase):
--   Run this in the Supabase SQL editor

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_macrocycle_per_user
ON macrocycles (user_id)
WHERE status = 'active';
