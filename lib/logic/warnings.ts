import type { RevisionSession } from '@/types/database';

export const DAILY_LIMIT_MINUTES = 120;

export interface Warning {
  type: 'daily_limit' | 'consecutive_hard';
  message: string;
}

export function getDailyWarnings(
  sessions: RevisionSession[],
  limitMinutes = DAILY_LIMIT_MINUTES
): Warning[] {
  const warnings: Warning[] = [];

  const planned = sessions.filter((s) => s.status === 'Planned' || s.status === 'Done');
  const totalMinutes = planned.reduce((sum, s) => sum + s.duration_minutes, 0);

  if (totalMinutes > limitMinutes) {
    warnings.push({
      type: 'daily_limit',
      message: `Daily total is ${totalMinutes} min — exceeds the ${limitMinutes} min limit.`,
    });
  }

  return warnings;
}

export function getWeeklyConsecutiveWarnings(
  sessions: RevisionSession[],
  // topics difficulty keyed by topic_id
  topicDifficulty: Record<string, number>
): Warning[] {
  const warnings: Warning[] = [];

  // Sort sessions by date then start_time
  const sorted = [...sessions]
    .filter((s) => s.status !== 'Skipped' && s.topic_id)
    .sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return (a.start_time ?? '').localeCompare(b.start_time ?? '');
    });

  let consecutiveHard = 0;
  for (const session of sorted) {
    const diff = session.topic_id ? (topicDifficulty[session.topic_id] ?? 0) : 0;
    if (diff >= 4) {
      consecutiveHard++;
      if (consecutiveHard > 2) {
        warnings.push({
          type: 'consecutive_hard',
          message: 'More than 2 consecutive high-difficulty sessions scheduled.',
        });
        break;
      }
    } else {
      consecutiveHard = 0;
    }
  }

  return warnings;
}
