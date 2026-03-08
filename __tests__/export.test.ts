import { toCSV } from '@/lib/logic/export';
import type { Subject, Topic, RevisionSession } from '@/types/database';

const subject: Subject = {
  id: 's1',
  user_id: 'u1',
  name: 'Mathematics',
  exam_board: 'AQA',
  exam_dates: [{ label: 'Paper 1', date: '2026-05-12' }],
  color: '#6366f1',
  weekly_target_hours: 2,
  created_at: '2026-01-01T00:00:00Z',
};

const topic: Topic = {
  id: 't1',
  subject_id: 's1',
  name: 'Algebra',
  status: 'Revising',
  difficulty: 4,
  priority: 'High',
  notes: null,
  last_revised_at: '2026-03-01T10:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
};

const session: RevisionSession = {
  id: 'r1',
  user_id: 'u1',
  subject_id: 's1',
  topic_id: 't1',
  date: '2026-03-08',
  start_time: '09:00:00',
  duration_minutes: 60,
  type: 'Notes',
  status: 'Done',
  skipped_count: 0,
  notes: null,
  created_at: '2026-03-08T09:00:00Z',
};

const exportData = {
  subjects: [subject],
  topics: [topic],
  sessions: [session],
  exportedAt: '2026-03-08T12:00:00Z',
};

describe('toCSV', () => {
  it('includes all three section headers', () => {
    const csv = toCSV(exportData);
    expect(csv).toContain('=== SUBJECTS ===');
    expect(csv).toContain('=== TOPICS ===');
    expect(csv).toContain('=== SESSIONS ===');
  });

  it('includes subject data', () => {
    const csv = toCSV(exportData);
    expect(csv).toContain('Mathematics');
    expect(csv).toContain('AQA');
    expect(csv).toContain('#6366f1');
  });

  it('includes topic data', () => {
    const csv = toCSV(exportData);
    expect(csv).toContain('Algebra');
    expect(csv).toContain('Revising');
    expect(csv).toContain('High');
  });

  it('includes session data', () => {
    const csv = toCSV(exportData);
    expect(csv).toContain('2026-03-08');
    expect(csv).toContain('60');
    expect(csv).toContain('Done');
    expect(csv).toContain('Notes');
  });

  it('wraps values in double quotes', () => {
    const csv = toCSV(exportData);
    expect(csv).toContain('"Mathematics"');
    expect(csv).toContain('"Algebra"');
  });

  it('escapes double quotes inside values', () => {
    const subjectWithQuote = { ...subject, name: 'Maths "Advanced"' };
    const csv = toCSV({ ...exportData, subjects: [subjectWithQuote] });
    expect(csv).toContain('"Maths ""Advanced"""');
  });

  it('handles empty data arrays', () => {
    const csv = toCSV({ subjects: [], topics: [], sessions: [], exportedAt: '' });
    expect(csv).toContain('=== SUBJECTS ===');
    expect(csv).toContain('=== TOPICS ===');
    expect(csv).toContain('=== SESSIONS ===');
  });

  it('returns a string', () => {
    expect(typeof toCSV(exportData)).toBe('string');
  });
});
