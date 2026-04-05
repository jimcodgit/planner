-- ============================================================
-- Migration 007: Student features
-- past_paper_attempts, exam_reflections, share_tokens, push_subscriptions
-- ============================================================

-- Past paper attempts
CREATE TABLE past_paper_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  paper_label TEXT NOT NULL,           -- e.g. "AQA Nov 2023 Paper 1"
  attempted_date DATE NOT NULL,
  score_raw SMALLINT,                  -- marks obtained
  score_max SMALLINT,                  -- total marks available
  grade TEXT,                          -- e.g. "7", "B", "Merit"
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_past_papers_user ON past_paper_attempts(user_id);
CREATE INDEX idx_past_papers_subject ON past_paper_attempts(subject_id);

ALTER TABLE past_paper_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "past_papers_select_own" ON past_paper_attempts
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "past_papers_select_parent" ON past_paper_attempts
  FOR SELECT USING (is_parent());
CREATE POLICY "past_papers_insert_own" ON past_paper_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid() AND NOT is_parent());
CREATE POLICY "past_papers_update_own" ON past_paper_attempts
  FOR UPDATE USING (user_id = auth.uid() AND NOT is_parent());
CREATE POLICY "past_papers_delete_own" ON past_paper_attempts
  FOR DELETE USING (user_id = auth.uid() AND NOT is_parent());

-- Exam reflections (post-exam rating)
CREATE TABLE exam_reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exam_label TEXT NOT NULL,
  exam_date DATE NOT NULL,
  prepared_rating SMALLINT CHECK (prepared_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, subject_id, exam_date, exam_label)
);

ALTER TABLE exam_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reflections_select_own" ON exam_reflections
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "reflections_select_parent" ON exam_reflections
  FOR SELECT USING (is_parent());
CREATE POLICY "reflections_insert_own" ON exam_reflections
  FOR INSERT WITH CHECK (user_id = auth.uid() AND NOT is_parent());
CREATE POLICY "reflections_update_own" ON exam_reflections
  FOR UPDATE USING (user_id = auth.uid() AND NOT is_parent());
CREATE POLICY "reflections_delete_own" ON exam_reflections
  FOR DELETE USING (user_id = auth.uid() AND NOT is_parent());

-- Share tokens (public read-only progress link per user)
CREATE TABLE share_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;

-- Owner can read/write their own token
CREATE POLICY "share_tokens_select_own" ON share_tokens
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "share_tokens_insert_own" ON share_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid() AND NOT is_parent());
CREATE POLICY "share_tokens_delete_own" ON share_tokens
  FOR DELETE USING (user_id = auth.uid() AND NOT is_parent());

-- Push subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subs_select_own" ON push_subscriptions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "push_subs_insert_own" ON push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "push_subs_delete_own" ON push_subscriptions
  FOR DELETE USING (user_id = auth.uid());
