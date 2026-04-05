'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateWeekPlan } from '@/lib/logic/planner';
import { getWeekDays, toISODate } from '@/lib/utils/dates';
import type { Subject, Topic, RevisionSession } from '@/types/database';

export async function planMyWeek(): Promise<{ count: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { count: 0, error: 'Not authenticated' };

  const weekDays = getWeekDays(new Date());
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekStartStr = toISODate(weekStart);
  const weekEndStr = toISODate(weekEnd);

  const [subjectsResult, sessionsResult, targetResult] = await Promise.all([
    supabase.from('subjects').select('*').eq('user_id', user.id).order('name'),
    supabase
      .from('revision_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekStartStr)
      .lte('date', weekEndStr),
    supabase
      .from('weekly_targets')
      .select('hours')
      .is('subject_id', null)
      .limit(1)
      .single(),
  ]);

  const subjects = (subjectsResult.data ?? []) as Subject[];
  const existingSessions = (sessionsResult.data ?? []) as RevisionSession[];
  const targetHours = targetResult.data?.hours ?? 10;

  const subjectIds = subjects.map((s) => s.id);
  const topicsResult = await supabase
    .from('topics')
    .select('*')
    .in('subject_id', subjectIds.length > 0 ? subjectIds : ['x']);

  const allTopics = (topicsResult.data ?? []) as Topic[];
  const topicsBySubject: Record<string, Topic[]> = {};
  for (const t of allTopics) {
    if (!topicsBySubject[t.subject_id]) topicsBySubject[t.subject_id] = [];
    topicsBySubject[t.subject_id].push(t);
  }

  const suggestions = generateWeekPlan({
    subjects,
    topicsBySubject,
    existingSessions,
    weekStart,
    dailyBudgetMinutes: 90,
    targetHours,
  });

  if (suggestions.length === 0) return { count: 0 };

  const rows = suggestions.map((s) => ({
    user_id: user.id,
    subject_id: s.subject_id,
    topic_id: s.topic_id,
    date: s.date,
    start_time: s.start_time,
    duration_minutes: s.duration_minutes,
    type: s.type,
    status: 'Planned' as const,
    skipped_count: 0,
    notes: null,
  }));

  const { error } = await supabase.from('revision_sessions').insert(rows);
  if (error) return { count: 0, error: error.message };

  revalidatePath('/weekly');
  revalidatePath('/daily');
  revalidatePath('/');
  return { count: suggestions.length };
}
