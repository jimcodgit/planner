import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { TodaysSessions } from '@/components/dashboard/TodaysSessions';
import { WeeklyProgressBar } from '@/components/dashboard/WeeklyProgressBar';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { ExamCountdownList } from '@/components/dashboard/ExamCountdownList';
import { computeStreak } from '@/lib/logic/streak';
import { getWeekDays, toISODate } from '@/lib/utils/dates';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single();

  // Redirect parent to their dashboard
  if (profile?.role === 'parent') {
    redirect('/parent');
  }

  const today = toISODate(new Date());
  const weekDays = getWeekDays(new Date());
  const weekStart = toISODate(weekDays[0]);
  const weekEnd = toISODate(weekDays[6]);

  const [subjectsResult, sessionsResult, targetResult, allSessionsResult] = await Promise.all([
    supabase.from('subjects').select('*').eq('user_id', user.id).order('name'),
    supabase
      .from('revision_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .order('start_time'),
    supabase
      .from('weekly_targets')
      .select('hours')
      .is('subject_id', null)
      .limit(1)
      .single(),
    // For streak: last 60 days
    supabase
      .from('revision_sessions')
      .select('date, status')
      .eq('user_id', user.id)
      .gte('date', toISODate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000))),
  ]);

  const subjects = subjectsResult.data ?? [];
  const weekSessions = sessionsResult.data ?? [];
  const allSessions = allSessionsResult.data ?? [];

  const topicIds = Array.from(
    new Set(weekSessions.filter((s) => s.topic_id).map((s) => s.topic_id!))
  );

  const topicsResult = await supabase
    .from('topics')
    .select('*')
    .in('id', topicIds.length > 0 ? topicIds : ['00000000-0000-0000-0000-000000000000']);

  const topics = topicsResult.data ?? [];
  const topicsById: Record<string, (typeof topics)[0]> = {};
  for (const t of topics) topicsById[t.id] = t;

  const subjectsById: Record<string, (typeof subjects)[0]> = {};
  for (const s of subjects) subjectsById[s.id] = s;

  const todaySessions = weekSessions.filter((s) => s.date === today);

  const doneMinutes = weekSessions
    .filter((s) => s.status === 'Done')
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  const plannedMinutes = weekSessions
    .filter((s) => s.status === 'Planned' || s.status === 'Done')
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  const targetHours = targetResult.data?.hours ?? 10;
  const targetMinutes = targetHours * 60;

  const streak = computeStreak(allSessions as Parameters<typeof computeStreak>[0]);

  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getTimeOfDay()}, {profile?.display_name ?? 'student'} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <WeeklyProgressBar
            doneMinutes={doneMinutes}
            targetMinutes={targetMinutes}
            plannedMinutes={plannedMinutes}
          />
        </div>
        <StreakCard streak={streak} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TodaysSessions
            sessions={todaySessions}
            subjectsById={subjectsById}
            topicsById={topicsById}
          />
        </div>
        <ExamCountdownList subjects={subjects} />
      </div>
    </PageWrapper>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
