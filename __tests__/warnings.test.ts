import { getDailyWarnings, getWeeklyConsecutiveWarnings, DAILY_LIMIT_MINUTES } from '@/lib/logic/warnings';
import type { RevisionSession } from '@/types/database';

function makeSession(
  overrides: Partial<RevisionSession> = {}
): RevisionSession {
  return {
    id: Math.random().toString(),
    user_id: 'u1',
    subject_id: 's1',
    topic_id: null,
    date: '2026-03-08',
    start_time: '09:00:00',
    duration_minutes: 30,
    type: 'Notes',
    status: 'Planned',
    skipped_count: 0,
    notes: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('getDailyWarnings', () => {
  it('returns no warnings when under limit', () => {
    const sessions = [
      makeSession({ duration_minutes: 60, status: 'Planned' }),
      makeSession({ duration_minutes: 30, status: 'Done' }),
    ];
    const warnings = getDailyWarnings(sessions);
    expect(warnings).toHaveLength(0);
  });

  it('returns a daily_limit warning when total exceeds limit', () => {
    const sessions = [
      makeSession({ duration_minutes: 90, status: 'Planned' }),
      makeSession({ duration_minutes: 60, status: 'Done' }),
    ];
    const warnings = getDailyWarnings(sessions);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe('daily_limit');
  });

  it('exactly at limit produces no warning', () => {
    const sessions = [makeSession({ duration_minutes: DAILY_LIMIT_MINUTES, status: 'Planned' })];
    expect(getDailyWarnings(sessions)).toHaveLength(0);
  });

  it('ignores Skipped sessions in total', () => {
    const sessions = [
      makeSession({ duration_minutes: 90, status: 'Skipped' }),
      makeSession({ duration_minutes: 60, status: 'Planned' }),
    ];
    // Only 60 min counts — no warning
    expect(getDailyWarnings(sessions)).toHaveLength(0);
  });

  it('respects a custom limit', () => {
    const sessions = [makeSession({ duration_minutes: 61, status: 'Planned' })];
    expect(getDailyWarnings(sessions, 60)).toHaveLength(1);
    expect(getDailyWarnings(sessions, 90)).toHaveLength(0);
  });

  it('includes warning message with actual and limit minutes', () => {
    const sessions = [makeSession({ duration_minutes: 150, status: 'Planned' })];
    const [warning] = getDailyWarnings(sessions);
    expect(warning.message).toContain('150 min');
    expect(warning.message).toContain(`${DAILY_LIMIT_MINUTES} min`);
  });
});

describe('getWeeklyConsecutiveWarnings', () => {
  const difficultyMap: Record<string, number> = {
    't1': 5,
    't2': 4,
    't3': 5,
    't4': 2,
  };

  it('returns no warnings with fewer than 3 consecutive hard sessions', () => {
    const sessions = [
      makeSession({ id: '1', topic_id: 't1', date: '2026-03-09', start_time: '09:00:00' }),
      makeSession({ id: '2', topic_id: 't2', date: '2026-03-09', start_time: '10:00:00' }),
      makeSession({ id: '3', topic_id: 't4', date: '2026-03-09', start_time: '11:00:00' }), // easy
    ];
    expect(getWeeklyConsecutiveWarnings(sessions, difficultyMap)).toHaveLength(0);
  });

  it('warns when more than 2 consecutive hard sessions', () => {
    const sessions = [
      makeSession({ id: '1', topic_id: 't1', date: '2026-03-09', start_time: '09:00:00' }),
      makeSession({ id: '2', topic_id: 't2', date: '2026-03-09', start_time: '10:00:00' }),
      makeSession({ id: '3', topic_id: 't3', date: '2026-03-09', start_time: '11:00:00' }),
    ];
    const warnings = getWeeklyConsecutiveWarnings(sessions, difficultyMap);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe('consecutive_hard');
  });

  it('resets count after an easy session', () => {
    const sessions = [
      makeSession({ id: '1', topic_id: 't1', date: '2026-03-09', start_time: '09:00:00' }),
      makeSession({ id: '2', topic_id: 't2', date: '2026-03-09', start_time: '10:00:00' }),
      makeSession({ id: '3', topic_id: 't4', date: '2026-03-09', start_time: '11:00:00' }), // easy — resets
      makeSession({ id: '4', topic_id: 't1', date: '2026-03-09', start_time: '12:00:00' }),
      makeSession({ id: '5', topic_id: 't3', date: '2026-03-09', start_time: '13:00:00' }),
    ];
    expect(getWeeklyConsecutiveWarnings(sessions, difficultyMap)).toHaveLength(0);
  });

  it('ignores Skipped sessions', () => {
    const sessions = [
      makeSession({ id: '1', topic_id: 't1', date: '2026-03-09', start_time: '09:00:00', status: 'Skipped' }),
      makeSession({ id: '2', topic_id: 't2', date: '2026-03-09', start_time: '10:00:00', status: 'Skipped' }),
      makeSession({ id: '3', topic_id: 't3', date: '2026-03-09', start_time: '11:00:00', status: 'Skipped' }),
    ];
    expect(getWeeklyConsecutiveWarnings(sessions, difficultyMap)).toHaveLength(0);
  });

  it('returns no warnings for empty sessions', () => {
    expect(getWeeklyConsecutiveWarnings([], difficultyMap)).toHaveLength(0);
  });

  it('sessions without topic_id do not count as hard', () => {
    const sessions = [
      makeSession({ id: '1', topic_id: null, date: '2026-03-09', start_time: '09:00:00' }),
      makeSession({ id: '2', topic_id: null, date: '2026-03-09', start_time: '10:00:00' }),
      makeSession({ id: '3', topic_id: null, date: '2026-03-09', start_time: '11:00:00' }),
    ];
    expect(getWeeklyConsecutiveWarnings(sessions, difficultyMap)).toHaveLength(0);
  });
});
