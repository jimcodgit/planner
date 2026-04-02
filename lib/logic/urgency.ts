import type { Topic, RevisionSession, ExamDate, TopicPriority, TopicStatus } from '@/types/database';
import { differenceInDays, parseISO } from 'date-fns';
import { format } from 'date-fns';

export type UrgencyLevel = 'Critical' | 'High' | 'Medium' | 'Low';

const STATUS_WEIGHT: Record<TopicStatus, number> = {
  'Not Started': 4,
  'Learning': 3,
  'Revising': 2,
  'Confident': 0,
};

const PRIORITY_WEIGHT: Record<TopicPriority, number> = {
  'High': 3,
  'Normal': 1,
  'Low': 0,
};

export function daysToEarliestExam(examDates: ExamDate[]): number | null {
  const today = new Date();
  const upcoming = examDates
    .map((ed) => differenceInDays(parseISO(ed.date), today))
    .filter((d) => d >= 0);
  if (upcoming.length === 0) return null;
  return Math.min(...upcoming);
}

function computeRawScore(topic: Topic): number {
  const statusWeight = STATUS_WEIGHT[topic.status];
  const difficultyWeight = topic.difficulty;
  const priorityWeight = PRIORITY_WEIGHT[topic.priority];

  let recencyPenalty = 0;
  if (!topic.last_revised_at) {
    recencyPenalty = 2;
  } else {
    const daysSince = differenceInDays(new Date(), parseISO(topic.last_revised_at));
    if (daysSince > 14) recencyPenalty = 1;
  }

  return statusWeight + difficultyWeight + priorityWeight + recencyPenalty;
}

function scoreToUrgency(score: number): UrgencyLevel {
  if (score >= 10) return 'Critical';
  if (score >= 7) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
}

function bumpUrgency(level: UrgencyLevel): UrgencyLevel {
  if (level === 'Low') return 'Medium';
  if (level === 'Medium') return 'High';
  if (level === 'High') return 'Critical';
  return 'Critical';
}

export function computeUrgency(topic: Topic, examDates: ExamDate[]): UrgencyLevel {
  const score = computeRawScore(topic);
  let urgency = scoreToUrgency(score);

  const days = daysToEarliestExam(examDates);
  if (days !== null && days <= 7 && topic.status !== 'Confident') {
    urgency = bumpUrgency(urgency);
  }

  return urgency;
}

export function urgencyToWeight(level: UrgencyLevel): number {
  return { Critical: 4, High: 3, Medium: 2, Low: 1 }[level];
}

export interface TopicGap {
  topic: Topic;
  urgency: UrgencyLevel;
  alreadyPlannedMinutes: number;
  recommendedMinutes: number;
  gap: number; // positive = need more, negative = over-planned
}

export interface GapAnalysis {
  topicGaps: TopicGap[];
  totalPlannedMinutes: number;
  totalRecommendedMinutes: number;
  daysToExam: number | null;
  weeksRemaining: number;
  minutesPerDayNeeded: number | null;
  feasibility: 'achievable' | 'manageable' | 'tight';
}

export function computeGapAnalysis(
  topics: Topic[],
  sessions: RevisionSession[],
  examDates: ExamDate[],
  weeklyTargetHours: number,
): GapAnalysis {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const daysToExam = daysToEarliestExam(examDates);
  const weeksRemaining = daysToExam !== null ? Math.ceil(daysToExam / 7) : 0;
  const totalRecommendedMinutes = Math.round(weeklyTargetHours * 60 * weeksRemaining);

  const nonConfidentTopics = topics.filter((t) => t.status !== 'Confident');

  const weighted = nonConfidentTopics.map((topic) => {
    const urgency = computeUrgency(topic, examDates);
    return { topic, urgency, weight: urgencyToWeight(urgency) };
  });

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);

  // planned minutes per topic (future planned sessions only)
  const plannedByTopic: Record<string, number> = {};
  for (const s of sessions) {
    if (s.status === 'Planned' && s.topic_id && s.date >= todayStr) {
      plannedByTopic[s.topic_id] = (plannedByTopic[s.topic_id] ?? 0) + s.duration_minutes;
    }
  }

  const topicGaps: TopicGap[] = weighted.map(({ topic, urgency, weight }) => {
    const recommended =
      totalWeight > 0
        ? Math.round((weight / totalWeight) * totalRecommendedMinutes)
        : 0;
    const planned = plannedByTopic[topic.id] ?? 0;
    return {
      topic,
      urgency,
      alreadyPlannedMinutes: planned,
      recommendedMinutes: recommended,
      gap: recommended - planned,
    };
  });

  topicGaps.sort((a, b) => urgencyToWeight(b.urgency) - urgencyToWeight(a.urgency));

  const totalPlannedMinutes = topicGaps.reduce((s, g) => s + g.alreadyPlannedMinutes, 0);
  const totalGapMinutes = topicGaps.reduce((s, g) => s + Math.max(0, g.gap), 0);

  let minutesPerDayNeeded: number | null = null;
  let feasibility: 'achievable' | 'manageable' | 'tight' = 'manageable';

  if (daysToExam !== null && daysToExam > 0) {
    minutesPerDayNeeded = Math.round(totalGapMinutes / daysToExam);
    if (minutesPerDayNeeded > 180) feasibility = 'tight';
    else if (minutesPerDayNeeded <= 60) feasibility = 'achievable';
    else feasibility = 'manageable';
  }

  return {
    topicGaps,
    totalPlannedMinutes,
    totalRecommendedMinutes,
    daysToExam,
    weeksRemaining,
    minutesPerDayNeeded,
    feasibility,
  };
}

export interface SuggestedSession {
  topic: Topic;
  urgency: UrgencyLevel;
}

export function computeSuggestedSession(
  topics: Topic[],
  sessions: RevisionSession[],
  examDates: ExamDate[],
): SuggestedSession | null {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const topicsWithFuturePlanned = new Set(
    sessions
      .filter((s) => s.status === 'Planned' && s.topic_id && s.date >= todayStr)
      .map((s) => s.topic_id!),
  );

  const candidates = topics
    .filter((t) => t.status !== 'Confident' && !topicsWithFuturePlanned.has(t.id))
    .map((t) => ({ topic: t, urgency: computeUrgency(t, examDates) }))
    .sort((a, b) => urgencyToWeight(b.urgency) - urgencyToWeight(a.urgency));

  return candidates[0] ?? null;
}
