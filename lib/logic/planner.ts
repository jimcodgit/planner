import { addDays, format } from 'date-fns';
import type { Subject, Topic, RevisionSession } from '@/types/database';
import { computePriorityScore } from './priority';

export interface PlannedSessionSuggestion {
  date: string;          // YYYY-MM-DD
  subject_id: string;
  topic_id: string | null;
  duration_minutes: number;
  type: 'Topic Review' | 'Practice Questions' | 'Practice Paper';
  start_time: string | null;
}

interface PlanInput {
  subjects: Subject[];
  topicsBySubject: Record<string, Topic[]>;
  existingSessions: RevisionSession[];
  weekStart: Date;           // Monday
  dailyBudgetMinutes: number; // e.g. 60
  targetHours: number;        // weekly target
}

const SESSION_DURATION = 30; // minutes per block
const START_HOUR = 17;       // default 5pm

export function generateWeekPlan(input: PlanInput): PlannedSessionSuggestion[] {
  const { subjects, topicsBySubject, existingSessions, weekStart, dailyBudgetMinutes, targetHours } = input;

  const totalBudgetMinutes = targetHours * 60;

  // Score every topic
  type ScoredTopic = { topic: Topic; subject: Subject; score: number };
  const scored: ScoredTopic[] = [];

  for (const subject of subjects) {
    const topics = topicsBySubject[subject.id] ?? [];
    for (const topic of topics) {
      if (topic.status === 'Confident') continue;
      const score = computePriorityScore(topic, subject.exam_dates ?? []);
      scored.push({ topic, subject, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  // Track minutes already planned per day (existing + new)
  const minutesByDay: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const day = format(addDays(weekStart, i), 'yyyy-MM-dd');
    const existingMins = existingSessions
      .filter((s) => s.date === day && (s.status === 'Planned' || s.status === 'Done'))
      .reduce((sum, s) => sum + s.duration_minutes, 0);
    minutesByDay[day] = existingMins;
  }

  const suggestions: PlannedSessionSuggestion[] = [];
  let totalAdded = 0;

  for (const { topic, subject } of scored) {
    if (totalAdded >= totalBudgetMinutes) break;

    // Find first day in the week with room
    for (let i = 0; i < 7; i++) {
      const day = format(addDays(weekStart, i), 'yyyy-MM-dd');
      if ((minutesByDay[day] ?? 0) + SESSION_DURATION <= dailyBudgetMinutes) {
        const sessionType = topic.status === 'Wobbly' ? 'Topic Review' : 'Practice Questions';

        suggestions.push({
          date: day,
          subject_id: subject.id,
          topic_id: topic.id,
          duration_minutes: SESSION_DURATION,
          type: sessionType,
          start_time: `${String(START_HOUR).padStart(2, '0')}:${String(minutesByDay[day] % 60).padStart(2, '0')}`,
        });

        minutesByDay[day] = (minutesByDay[day] ?? 0) + SESSION_DURATION;
        totalAdded += SESSION_DURATION;
        break;
      }
    }
  }

  return suggestions;
}
