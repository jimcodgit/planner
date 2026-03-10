import { createClient } from '@/lib/supabase/server';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { WeekGrid } from '@/components/weekly/WeekGrid';
import { getWeekDays, toISODate } from '@/lib/utils/dates';
import { getDailyWarnings, getWeeklyConsecutiveWarnings } from '@/lib/logic/warnings';

export default async function WeeklyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isParent = profile?.role === 'parent';

  const today = new Date();
  const weekDays = getWeekDays(today);

  // Fetch a wider window so week navigation and copying to future weeks works
  const windowStart = toISODate(new Date(weekDays[0].getTime() - 21 * 24 * 60 * 60 * 1000));
  const windowEnd = toISODate(new Date(weekDays[6].getTime() + 21 * 24 * 60 * 60 * 1000));

  const weekStart = toISODate(weekDays[0]);
  const weekEnd = toISODate(weekDays[6]);

  // Fetch subjects
  let subjectsQuery = supabase.from('subjects').select('*').order('name');
  if (!isParent) subjectsQuery = subjectsQuery.eq('user_id', user.id);
  const { data: subjects } = await subjectsQuery;

  const subjectIds = subjects?.map((s) => s.id) ?? [];

  const [topicsResult, sessionsResult, targetResult] = await Promise.all([
    supabase.from('topics').select('*').in('subject_id', subjectIds),
    supabase
      .from('revision_sessions')
      .select('*')
      .in('subject_id', subjectIds)
      .gte('date', windowStart)
      .lte('date', windowEnd)
      .order('start_time'),
    supabase
      .from('weekly_targets')
      .select('hours')
      .is('subject_id', null)
      .limit(1)
      .single(),
  ]);

  const topics = topicsResult.data ?? [];
  const sessions = sessionsResult.data ?? [];

  const topicsBySubject: Record<string, typeof topics> = {};
  const topicsById: Record<string, (typeof topics)[0]> = {};
  const subjectsById: Record<string, (typeof subjects extends null ? never : NonNullable<typeof subjects>[0])> = {};

  for (const t of topics) {
    topicsBySubject[t.subject_id] = [...(topicsBySubject[t.subject_id] ?? []), t];
    topicsById[t.id] = t;
  }
  for (const s of subjects ?? []) {
    subjectsById[s.id] = s;
  }

  const weeklyTargetHours = targetResult.data?.hours ?? 10;
  const weeklyTargetMinutes = weeklyTargetHours * 60;

  // Warnings
  const topicDifficultyMap: Record<string, number> = {};
  for (const t of topics) topicDifficultyMap[t.id] = t.difficulty;

  const thisWeekSessions = sessions.filter((s) => s.date >= weekStart && s.date <= weekEnd);
  const consecutiveWarnings = getWeeklyConsecutiveWarnings(thisWeekSessions, topicDifficultyMap);

  return (
    <PageWrapper title="Weekly Planner">
      {consecutiveWarnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {consecutiveWarnings.map((w, i) => (
            <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
              ⚠️ {w.message}
            </div>
          ))}
        </div>
      )}
      <WeekGrid
        initialSessions={sessions}
        subjects={subjects ?? []}
        topicsBySubject={topicsBySubject}
        topicsById={topicsById}
        subjectsById={subjectsById}
        weeklyTargetMinutes={weeklyTargetMinutes}
        isParent={isParent}
      />
    </PageWrapper>
  );
}
