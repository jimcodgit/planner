import type { Topic } from '@/types/database';
import type { ExamDate } from '@/types/database';
import { differenceInDays, parseISO } from 'date-fns';

const EXAM_HORIZON_DAYS = 120;

function examUrgency(examDates: ExamDate[]): number {
  if (!examDates || examDates.length === 0) return 0.5;
  const now = new Date();
  const upcoming = examDates
    .map((ed) => differenceInDays(parseISO(ed.date), now))
    .filter((d) => d >= 0);
  if (upcoming.length === 0) return 0; // exams already past
  const nearest = Math.min(...upcoming);
  return Math.max(0, 1 - nearest / EXAM_HORIZON_DAYS);
}

const STATUS_WEIGHT: Record<string, number> = {
  'Not Started': 1.0,
  'Wobbly': 0.75,
  'Brush Up': 0.4,
  'Confident': 0.1,
};

function statusScore(topic: Topic): number {
  return STATUS_WEIGHT[topic.status] ?? 0.5;
}

function stalenessScore(topic: Topic): number {
  if (!topic.last_revised_at) return 1.0;
  const days = differenceInDays(new Date(), parseISO(topic.last_revised_at));
  return Math.min(days / 14, 1);
}

function difficultyScore(topic: Topic): number {
  return (topic.difficulty - 1) / 4;
}

export function computePriorityScore(topic: Topic, examDates: ExamDate[]): number {
  const urgency = examUrgency(examDates) * 0.35;
  const status = statusScore(topic) * 0.30;
  const staleness = stalenessScore(topic) * 0.20;
  const difficulty = difficultyScore(topic) * 0.15;
  return Math.round((urgency + status + staleness + difficulty) * 100);
}

export function sortByPriority(
  topics: Topic[],
  examDates: ExamDate[]
): (Topic & { priorityScore: number })[] {
  return topics
    .map((t) => ({ ...t, priorityScore: computePriorityScore(t, examDates) }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}
