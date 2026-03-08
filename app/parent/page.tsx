import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { ParentWeeklySummary } from '@/components/parent/ParentWeeklySummary';
import { NeverRevisedTopics } from '@/components/parent/NeverRevisedTopics';
import { UpcomingExamsAlert } from '@/components/parent/UpcomingExamsAlert';
import { WeeklyTargetSetter } from '@/components/parent/WeeklyTargetSetter';
import { ExamCountdownList } from '@/components/dashboard/ExamCountdownList';
import { getWeekDays, toISODate } from '@/lib/utils/dates';

export default async function ParentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'parent') redirect('/');

  const weekDays = getWeekDays(new Date());
  const weekStart = toISODate(weekDays[0]);
  const weekEnd = toISODate(weekDays[6]);

  const [subjectsResult, targetResult] = await Promise.all([
    supabase.from('subjects').select('*').order('name'),
    supabase
      .from('weekly_targets')
      .select('hours')
      .is('subject_id', null)
      .limit(1)
      .single(),
  ]);

  const subjects = subjectsResult.data ?? [];
  const subjectIds = subjects.map((s) => s.id);

  const [topicsResult, sessionsResult] = await Promise.all([
    supabase.from('topics').select('*').in('subject_id', subjectIds.length > 0 ? subjectIds : ['x']),
    supabase
      .from('revision_sessions')
      .select('*')
      .in('subject_id', subjectIds.length > 0 ? subjectIds : ['x'])
      .gte('date', weekStart)
      .lte('date', weekEnd),
  ]);

  const topics = topicsResult.data ?? [];
  const weekSessions = sessionsResult.data ?? [];

  const topicsBySubject: Record<string, typeof topics> = {};
  const subjectsById: Record<string, (typeof subjects)[0]> = {};

  for (const t of topics) {
    topicsBySubject[t.subject_id] = [...(topicsBySubject[t.subject_id] ?? []), t];
  }
  for (const s of subjects) {
    subjectsById[s.id] = s;
  }

  const targetHours = targetResult.data?.hours ?? 10;
  const targetMinutes = targetHours * 60;

  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Parent overview</h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <ParentWeeklySummary
            subjects={subjects}
            weekSessions={weekSessions}
            targetMinutes={targetMinutes}
          />
          <UpcomingExamsAlert
            subjects={subjects}
            topicsBySubject={topicsBySubject}
          />
          <NeverRevisedTopics
            topics={topics}
            subjectsById={subjectsById}
          />
        </div>

        <div className="space-y-4">
          <WeeklyTargetSetter currentTarget={targetHours} />
          <ExamCountdownList subjects={subjects} />
        </div>
      </div>
    </PageWrapper>
  );
}
