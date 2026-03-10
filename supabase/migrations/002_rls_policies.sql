-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_targets ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user a parent?
-- We use EXISTS to avoid extra JOINs
CREATE OR REPLACE FUNCTION is_parent()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'parent'
  );
$$;

-- Helper: get the student user id (the only non-parent user)
CREATE OR REPLACE FUNCTION student_uid()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM profiles WHERE role = 'student' LIMIT 1;
$$;

-- PROFILES
-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Parents can also read all profiles
CREATE POLICY "profiles_select_parent" ON profiles
  FOR SELECT USING (is_parent());

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Allow insert on profile creation (used in sign-up trigger or direct insert)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- SUBJECTS
-- Students can CRUD their own subjects
CREATE POLICY "subjects_select_own" ON subjects
  FOR SELECT USING (user_id = auth.uid());

-- Parents can read all subjects
CREATE POLICY "subjects_select_parent" ON subjects
  FOR SELECT USING (is_parent());

CREATE POLICY "subjects_insert_own" ON subjects
  FOR INSERT WITH CHECK (user_id = auth.uid() AND NOT is_parent());

CREATE POLICY "subjects_update_own" ON subjects
  FOR UPDATE USING (user_id = auth.uid() AND NOT is_parent());

CREATE POLICY "subjects_delete_own" ON subjects
  FOR DELETE USING (user_id = auth.uid() AND NOT is_parent());

-- Parents can update subjects (e.g. exam dates)
CREATE POLICY "subjects_update_parent" ON subjects
  FOR UPDATE USING (is_parent());

-- TOPICS (owned via subject)
CREATE POLICY "topics_select_own" ON topics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM subjects WHERE subjects.id = topics.subject_id AND subjects.user_id = auth.uid())
  );

CREATE POLICY "topics_select_parent" ON topics
  FOR SELECT USING (is_parent());

CREATE POLICY "topics_insert_own" ON topics
  FOR INSERT WITH CHECK (
    NOT is_parent() AND
    EXISTS (SELECT 1 FROM subjects WHERE subjects.id = topics.subject_id AND subjects.user_id = auth.uid())
  );

CREATE POLICY "topics_update_own" ON topics
  FOR UPDATE USING (
    NOT is_parent() AND
    EXISTS (SELECT 1 FROM subjects WHERE subjects.id = topics.subject_id AND subjects.user_id = auth.uid())
  );

CREATE POLICY "topics_delete_own" ON topics
  FOR DELETE USING (
    NOT is_parent() AND
    EXISTS (SELECT 1 FROM subjects WHERE subjects.id = topics.subject_id AND subjects.user_id = auth.uid())
  );

-- REVISION_SESSIONS
CREATE POLICY "sessions_select_own" ON revision_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "sessions_select_parent" ON revision_sessions
  FOR SELECT USING (is_parent());

CREATE POLICY "sessions_insert_own" ON revision_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid() AND NOT is_parent());

CREATE POLICY "sessions_update_own" ON revision_sessions
  FOR UPDATE USING (user_id = auth.uid() AND NOT is_parent());

CREATE POLICY "sessions_delete_own" ON revision_sessions
  FOR DELETE USING (user_id = auth.uid() AND NOT is_parent());

-- WEEKLY_TARGETS
-- Everyone can read targets
CREATE POLICY "targets_select_all" ON weekly_targets
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only parent can write targets
CREATE POLICY "targets_insert_parent" ON weekly_targets
  FOR INSERT WITH CHECK (is_parent() AND set_by = auth.uid());

CREATE POLICY "targets_update_parent" ON weekly_targets
  FOR UPDATE USING (is_parent());

CREATE POLICY "targets_delete_parent" ON weekly_targets
  FOR DELETE USING (is_parent());
