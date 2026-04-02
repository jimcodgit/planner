import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { SubjectCard } from '@/components/subjects/SubjectCard';
import { AddSubjectButton } from './AddSubjectButton';
import { toISODate, getWeekDays } from '@/lib/utils/dates';

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isParent = profile?.role === 'parent';

  let query = supabase.from('subjects').select('*').order('name');
  if (!isParent) {
    query = query.eq('user_id', user.id);
  }
  const { data: subjects } = await query;

  const today = new Date();
  const weekDays = getWeekDays(today);
  const weekStart = toISODate(weekDays[0]);
  const weekEnd = toISODate(weekDays[6]);
  const todayStr = toISODate(today);

  const subjectIds = subjects?.map((s) => s.id) ?? [];

  const [topicsResult, thisWeekResult, allDoneResult, futurePlannedResult] = await Promise.all([
    supabase.from('topics').select('*').in('subject_id', subjectIds.length > 0 ? subjectIds : ['x']),
    supabase
      .from('revision_sessions')
      .select('subject_id, duration_minutes, status')
      .in('subject_id', subjectIds.length > 0 ? subjectIds : ['x'])
      .gte('date', weekStart)
      .lte('date', weekEnd),
    supabase
      .from('revision_sessions')
      .select('subject_id, duration_minutes, type')
      .in('subject_id', subjectIds.length > 0 ? subjectIds : ['x'])
      .eq('status', 'Done'),
    supabase
      .from('revision_sessions')
      .select('subject_id, duration_minutes, type')
      .in('subject_id', subjectIds.length > 0 ? subjectIds : ['x'])
      .eq('status', 'Planned')
      .gte('date', todayStr),
  ]);

  const topicsBySubject: Record<string, typeof topicsResult.data> = {};
  for (const t of topicsResult.data ?? []) {
    topicsBySubject[t.subject_id] = [...(topicsBySubject[t.subject_id] ?? []), t];
  }

  // This-week done minutes per subject
  const weekDoneBySubject: Record<string, number> = {};
  for (const s of thisWeekResult.data ?? []) {
    if (s.status === 'Done') {
      weekDoneBySubject[s.subject_id] = (weekDoneBySubject[s.subject_id] ?? 0) + s.duration_minutes;
    }
  }

  // All-time completed minutes by subject+type
  const completedBySubjectType: Record<string, Record<string, number>> = {};
  for (const s of allDoneResult.data ?? []) {
    if (!completedBySubjectType[s.subject_id]) completedBySubjectType[s.subject_id] = {};
    completedBySubjectType[s.subject_id][s.type] =
      (completedBySubjectType[s.subject_id][s.type] ?? 0) + s.duration_minutes;
  }

  // Future planned minutes by subject+type
  const plannedBySubjectType: Record<string, Record<string, number>> = {};
  for (const s of futurePlannedResult.data ?? []) {
    if (!plannedBySubjectType[s.subject_id]) plannedBySubjectType[s.subject_id] = {};
    plannedBySubjectType[s.subject_id][s.type] =
      (plannedBySubjectType[s.subject_id][s.type] ?? 0) + s.duration_minutes;
  }

  return (
    <PageWrapper title="Subjects">
      <div className="flex items-center justify-between mb-6">
        {!isParent ? <AddSubjectButton /> : <div />}
        <Link
          href="/reports/wall"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Wall Report
        </Link>
      </div>
      {(!subjects || subjects.length === 0) && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📖</div>
          <p className="text-lg font-medium">No subjects yet</p>
          {!isParent && <p className="text-sm mt-1">Add your first subject to get started.</p>}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects?.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            topics={topicsBySubject[subject.id] ?? []}
            weekDoneMinutes={weekDoneBySubject[subject.id] ?? 0}
            completedByType={completedBySubjectType[subject.id] ?? {}}
            plannedByType={plannedBySubjectType[subject.id] ?? {}}
          />
        ))}
      </div>
    </PageWrapper>
  );
}
