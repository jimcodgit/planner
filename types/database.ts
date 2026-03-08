export type TopicStatus = 'Not Started' | 'Learning' | 'Revising' | 'Confident';
export type TopicPriority = 'Low' | 'Normal' | 'High';
export type SessionType = 'Notes' | 'Questions' | 'Past Paper' | 'Flashcards' | 'Other';
export type SessionStatus = 'Planned' | 'Done' | 'Skipped' | 'Moved';
export type UserRole = 'student' | 'parent';

export interface ExamDate {
  label: string;
  date: string; // ISO date string YYYY-MM-DD
}

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string;
  created_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  exam_board: string | null;
  exam_dates: ExamDate[];
  color: string;
  weekly_target_hours: number;
  created_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  status: TopicStatus;
  difficulty: number;
  priority: TopicPriority;
  notes: string | null;
  last_revised_at: string | null;
  created_at: string;
}

export interface RevisionSession {
  id: string;
  user_id: string;
  subject_id: string;
  topic_id: string | null;
  date: string; // ISO date YYYY-MM-DD
  start_time: string | null; // HH:MM:SS
  duration_minutes: number;
  type: SessionType;
  status: SessionStatus;
  skipped_count: number;
  notes: string | null;
  created_at: string;
}

export interface WeeklyTarget {
  id: string;
  set_by: string;
  subject_id: string | null;
  hours: number;
  created_at: string;
}

// Join types
export interface SessionWithSubject extends RevisionSession {
  subjects: Pick<Subject, 'name' | 'color'>;
  topics: Pick<Topic, 'name'> | null;
}

export interface SubjectWithStats extends Subject {
  topics: Topic[];
  sessions_this_week: RevisionSession[];
}
