import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { TodaysSessions } from '@/components/dashboard/TodaysSessions';
import { WeeklyProgressBar } from '@/components/dashboard/WeeklyProgressBar';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { ExamCountdownList } from '@/components/dashboard/ExamCountdownList';
import { SpacedRepetitionNudges } from '@/components/dashboard/SpacedRepetitionNudges';
import { ExamReflectionBanner } from '@/components/dashboard/ExamReflectionBanner';
import { NotificationOptIn } from '@/components/dashboard/NotificationOptIn';
import { computeStreak } from '@/lib/logic/streak';
import { getWeekDays, toISODate } from '@/lib/utils/dates';
import { differenceInDays } from 'date-fns';
import type { Subject, Topic, ExamDate, ExamReflection } from '@/types/database';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single();

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
    supabase
      .from('revision_sessions')
      .select('date, status')
      .eq('user_id', user.id)
      .gte('date', toISODate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000))),
  ]);

  const subjects = (subjectsResult.data ?? []) as Subject[];
  const weekSessions = sessionsResult.data ?? [];
  const allSessions = allSessionsResult.data ?? [];

  const subjectIds = subjects.map((s) => s.id);

  // Fetch all topics for spaced repetition nudges
  const topicsResult = await supabase
    .from('topics')
    .select('*')
    .in('subject_id', subjectIds.length > 0 ? subjectIds : ['x']);

  const allTopics = (topicsResult.data ?? []) as Topic[];

  // Build lookups
  const topicIds = Array.from(new Set(weekSessions.filter((s) => s.topic_id).map((s) => s.topic_id!)));
  const weekTopicsResult = await supabase
    .from('topics')
    .select('*')
    .in('id', topicIds.length > 0 ? topicIds : ['x']);

  const weekTopics = weekTopicsResult.data ?? [];
  const topicsById: Record<string, (typeof weekTopics)[0]> = {};
  for (const t of weekTopics) topicsById[t.id] = t;

  const subjectsById: Record<string, Subject> = {};
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

  // Spaced repetition: enrich topics with their subject
  const topicsWithSubject = allTopics.map((t) => ({
    ...t,
    subject: subjectsById[t.subject_id],
  })).filter((t) => t.subject);

  // Exam reflection: find exams in the last 7 days
  const recentPastExams: { subject: Subject; exam: ExamDate; daysAgo: number }[] = [];
  for (const subject of subjects) {
    for (const exam of (subject.exam_dates ?? []) as ExamDate[]) {
      const daysAgo = differenceInDays(new Date(), new Date(exam.date));
      if (daysAgo >= 0 && daysAgo <= 7) {
        recentPastExams.push({ subject, exam, daysAgo });
      }
    }
  }

  // Fetch existing reflections
  let existingReflectionKeys = new Set<string>();
  if (recentPastExams.length > 0) {
    const { data: reflections } = await supabase
      .from('exam_reflections')
      .select('subject_id, exam_date, exam_label')
      .eq('user_id', user.id);
    existingReflectionKeys = new Set(
      (reflections ?? []).map((r: Partial<ExamReflection>) => `${r.subject_id}|${r.exam_date}|${r.exam_label}`)
    );
  }

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

      <ExamReflectionBanner
        pastExams={recentPastExams}
        existingReflectionKeys={existingReflectionKeys}
      />

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
        <div className="lg:col-span-2 space-y-4">
          <TodaysSessions
            sessions={todaySessions}
            subjectsById={subjectsById}
            topicsById={topicsById}
          />
          <SpacedRepetitionNudges topics={topicsWithSubject} />
          <NotificationOptIn />
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
