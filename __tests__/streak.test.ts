import { computeStreak } from '@/lib/logic/streak';
import type { RevisionSession } from '@/types/database';
import { format, subDays } from 'date-fns';

function isoDate(daysAgo: number): string {
  return format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
}

function makeSession(date: string, status: RevisionSession['status'] = 'Done'): RevisionSession {
  return {
    id: Math.random().toString(),
    user_id: 'u1',
    subject_id: 's1',
    topic_id: null,
    date,
    start_time: null,
    duration_minutes: 30,
    type: 'Notes',
    status,
    skipped_count: 0,
    notes: null,
    created_at: new Date().toISOString(),
  };
}

describe('computeStreak', () => {
  it('returns 0 for empty sessions', () => {
    expect(computeStreak([])).toBe(0);
  });

  it('returns 0 when no done sessions', () => {
    const sessions = [makeSession(isoDate(0), 'Planned')];
    expect(computeStreak(sessions)).toBe(0);
  });

  it('returns 1 for a single done session today', () => {
    const sessions = [makeSession(isoDate(0))];
    expect(computeStreak(sessions)).toBe(1);
  });

  it('returns 1 for a single done session yesterday', () => {
    const sessions = [makeSession(isoDate(1))];
    expect(computeStreak(sessions)).toBe(1);
  });

  it('returns 0 when most recent done session is 2+ days ago', () => {
    const sessions = [makeSession(isoDate(2))];
    expect(computeStreak(sessions)).toBe(0);
  });

  it('counts consecutive days correctly', () => {
    const sessions = [
      makeSession(isoDate(0)),
      makeSession(isoDate(1)),
      makeSession(isoDate(2)),
    ];
    expect(computeStreak(sessions)).toBe(3);
  });

  it('stops counting at a gap in days', () => {
    const sessions = [
      makeSession(isoDate(0)),
      makeSession(isoDate(1)),
      // gap — day 2 missing
      makeSession(isoDate(3)),
      makeSession(isoDate(4)),
    ];
    expect(computeStreak(sessions)).toBe(2);
  });

  it('deduplicates multiple sessions on the same day', () => {
    const sessions = [
      makeSession(isoDate(0)),
      makeSession(isoDate(0)), // duplicate
      makeSession(isoDate(1)),
    ];
    expect(computeStreak(sessions)).toBe(2);
  });

  it('ignores non-Done sessions in streak', () => {
    const sessions = [
      makeSession(isoDate(0), 'Done'),
      makeSession(isoDate(1), 'Skipped'),
      makeSession(isoDate(2), 'Done'),
    ];
    // Gap at day 1 (only Skipped, no Done) breaks streak
    expect(computeStreak(sessions)).toBe(1);
  });

  it('handles a long streak correctly', () => {
    const sessions = Array.from({ length: 10 }, (_, i) => makeSession(isoDate(i)));
    expect(computeStreak(sessions)).toBe(10);
  });
});
