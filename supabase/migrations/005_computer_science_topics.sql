-- Computer Science subject and topics
-- Run in Supabase SQL Editor
-- Assumes a student profile exists. Change exam_board if not AQA.

-- Step 1: Add unique constraint to prevent duplicate topics (safe if already exists)
ALTER TABLE topics
  ADD CONSTRAINT IF NOT EXISTS topics_subject_name_unique UNIQUE (subject_id, name);

-- Step 2: Insert Computer Science subject (skips if already exists for this student)
INSERT INTO subjects (user_id, name, exam_board, color, weekly_target_hours)
SELECT
  p.id,
  'Computer Science',
  'AQA',
  '#8b5cf6',
  1
FROM profiles p
WHERE p.role = 'student'
ON CONFLICT DO NOTHING;

-- Step 3: Insert topics (ON CONFLICT DO NOTHING is safe once unique constraint exists)
INSERT INTO topics (subject_id, name, status, difficulty, priority)
SELECT s.id, t.name, 'Not Started', 3, 'Normal'
FROM subjects s
CROSS JOIN (VALUES
  -- Paper 1: Computer Systems
  ('Systems architecture'),
  ('Memory and storage'),
  ('Networks'),
  ('Cyber security'),
  ('System software'),
  ('Ethical and legal issues'),
  -- Paper 2: Programming
  ('Algorithms'),
  ('Programming constructs'),
  ('Data types'),
  ('Boolean logic'),
  ('Translators (compiler and interpreter)')
) AS t(name)
WHERE s.name = 'Computer Science'
ON CONFLICT (subject_id, name) DO NOTHING;
