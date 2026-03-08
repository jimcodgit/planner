-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMs
CREATE TYPE topic_status AS ENUM ('Not Started', 'Learning', 'Revising', 'Confident');
CREATE TYPE topic_priority AS ENUM ('Low', 'Normal', 'High');
CREATE TYPE session_type AS ENUM ('Notes', 'Questions', 'Past Paper', 'Flashcards', 'Other');
CREATE TYPE session_status AS ENUM ('Planned', 'Done', 'Skipped', 'Moved');
CREATE TYPE user_role AS ENUM ('student', 'parent');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subjects
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exam_board TEXT,
  exam_dates JSONB NOT NULL DEFAULT '[]',
  color TEXT NOT NULL DEFAULT '#6366f1',
  weekly_target_hours NUMERIC(4,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Topics
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status topic_status NOT NULL DEFAULT 'Not Started',
  difficulty SMALLINT NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  priority topic_priority NOT NULL DEFAULT 'Normal',
  notes TEXT,
  last_revised_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Revision Sessions
CREATE TABLE revision_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME,
  duration_minutes SMALLINT NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  type session_type NOT NULL DEFAULT 'Notes',
  status session_status NOT NULL DEFAULT 'Planned',
  skipped_count SMALLINT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weekly Targets (parent sets, subject_id NULL = global target)
CREATE TABLE weekly_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  hours NUMERIC(4,2) NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subject_id)
);

-- Create a unique partial index for the global target (subject_id IS NULL)
CREATE UNIQUE INDEX weekly_targets_global_unique ON weekly_targets (set_by) WHERE subject_id IS NULL;

-- Indexes for common queries
CREATE INDEX idx_revision_sessions_user_date ON revision_sessions(user_id, date);
CREATE INDEX idx_revision_sessions_subject ON revision_sessions(subject_id);
CREATE INDEX idx_topics_subject ON topics(subject_id);
CREATE INDEX idx_subjects_user ON subjects(user_id);
