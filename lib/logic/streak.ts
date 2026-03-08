import type { RevisionSession } from '@/types/database';
import { differenceInCalendarDays, parseISO } from 'date-fns';

export function computeStreak(sessions: RevisionSession[]): number {
  const doneDates = Array.from(
    new Set(
      sessions
        .filter((s) => s.status === 'Done')
        .map((s) => s.date)
    )
  ).sort((a, b) => b.localeCompare(a)); // newest first

  if (doneDates.length === 0) return 0;

  const today = new Date();
  const mostRecent = parseISO(doneDates[0]);
  const daysSinceMostRecent = differenceInCalendarDays(today, mostRecent);

  // Streak must include today or yesterday
  if (daysSinceMostRecent > 1) return 0;

  let streak = 1;
  for (let i = 1; i < doneDates.length; i++) {
    const prev = parseISO(doneDates[i - 1]);
    const curr = parseISO(doneDates[i]);
    const gap = differenceInCalendarDays(prev, curr);
    if (gap === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
