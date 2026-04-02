-- Rename topic_status enum values: Learning → Wobbly, Revising → Brush Up
-- Run in Supabase SQL Editor

-- Step 1: Migrate existing data before changing the type
UPDATE topics SET status = 'Wobbly'    WHERE status = 'Learning';
UPDATE topics SET status = 'Brush Up'  WHERE status = 'Revising';

-- Step 2: Recreate the enum with the new values
--         (PostgreSQL cannot rename or drop enum values directly)
ALTER TABLE topics ALTER COLUMN status TYPE TEXT;
DROP TYPE topic_status;
CREATE TYPE topic_status AS ENUM ('Not Started', 'Wobbly', 'Brush Up', 'Confident');
ALTER TABLE topics ALTER COLUMN status TYPE topic_status USING status::topic_status;
