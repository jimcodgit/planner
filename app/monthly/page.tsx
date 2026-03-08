import { createClient } from '@/lib/supabase/server';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { MonthGrid } from '@/components/monthly/MonthGrid';
import { startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { toISODate } from '@/lib/utils/dates';

export default async function MonthlyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isParent = profile?.role === 'parent';

  // Fetch 3 months of sessions (prev, current, next) so client-side nav works
  const now = new Date();
  const rangeStart = toISODate(startOfMonth(subMonths(now, 1)));
  const rangeEnd = toISODate(endOfMonth(addMonths(now, 1)));

  let subjectsQuery = supabase.from('subjects').select('*').order('name');
  if (!isParent) subjectsQuery = subjectsQuery.eq('user_id', user.id);
  const { data: subjects } = await subjectsQuery;

  const subjectIds = subjects?.map((s) => s.id) ?? [];

  const [topicsResult, sessionsResult] = await Promise.all([
    supabase.from('topics').select('*').in('subject_id', subjectIds.length > 0 ? subjectIds : ['x']),
    supabase
      .from('revision_sessions')
      .select('*')
      .in('subject_id', subjectIds.length > 0 ? subjectIds : ['x'])
      .gte('date', rangeStart)
      .lte('date', rangeEnd)
      .order('start_time'),
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

  // Build exam markers from all subjects
  const examMarkers = (subjects ?? []).flatMap((s) =>
    s.exam_dates.map((ed: { label: string; date: string }) => ({
      date: ed.date,
      label: ed.label,
      subjectName: s.name,
      color: s.color,
    }))
  );

  return (
    <PageWrapper title="Monthly View">
      <MonthGrid
        initialSessions={sessions}
        subjects={subjects ?? []}
        topicsBySubject={topicsBySubject}
        topicsById={topicsById}
        subjectsById={subjectsById}
        examMarkers={examMarkers}
        isParent={isParent}
      />
    </PageWrapper>
  );
}
