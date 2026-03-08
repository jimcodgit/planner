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

  // For parent, show student's subjects
  let query = supabase.from('subjects').select('*').order('name');
  if (!isParent) {
    query = query.eq('user_id', user.id);
  }
  const { data: subjects } = await query;

  const today = new Date();
  const weekDays = getWeekDays(today);
  const weekStart = toISODate(weekDays[0]);
  const weekEnd = toISODate(weekDays[6]);

  const subjectIds = subjects?.map((s) => s.id) ?? [];

  const [topicsResult, sessionsResult] = await Promise.all([
    supabase.from('topics').select('*').in('subject_id', subjectIds),
    supabase
      .from('revision_sessions')
      .select('*')
      .in('subject_id', subjectIds)
      .gte('date', weekStart)
      .lte('date', weekEnd),
  ]);

  const topicsBySubject: Record<string, typeof topicsResult.data> = {};
  const sessionsBySubject: Record<string, typeof sessionsResult.data> = {};

  for (const t of topicsResult.data ?? []) {
    topicsBySubject[t.subject_id] = [...(topicsBySubject[t.subject_id] ?? []), t];
  }
  for (const s of sessionsResult.data ?? []) {
    sessionsBySubject[s.subject_id] = [...(sessionsBySubject[s.subject_id] ?? []), s];
  }

  return (
    <PageWrapper title="Subjects">
      {!isParent && (
        <div className="mb-6">
          <AddSubjectButton />
        </div>
      )}
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
            sessionsThisWeek={sessionsBySubject[subject.id] ?? []}
          />
        ))}
      </div>
    </PageWrapper>
  );
}
