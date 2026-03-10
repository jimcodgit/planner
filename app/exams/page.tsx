import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { ExamOverviewTable } from '@/components/exams/ExamOverviewTable';
import { toISODate } from '@/lib/utils/dates';

export default async function ExamsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isParent = profile?.role === 'parent';
  const today = toISODate(new Date());

  const subjectsResult = isParent
    ? await supabase.from('subjects').select('*').order('name')
    : await supabase.from('subjects').select('*').eq('user_id', user.id).order('name');

  const subjects = subjectsResult.data ?? [];
  const subjectIds = subjects.map((s) => s.id);

  if (subjectIds.length === 0) {
    return (
      <PageWrapper>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Exam countdown</h1>
        <p className="text-gray-500">No subjects found.</p>
      </PageWrapper>
    );
  }

  const [doneResult, plannedResult] = await Promise.all([
    supabase
      .from('revision_sessions')
      .select('subject_id, duration_minutes')
      .in('subject_id', subjectIds)
      .eq('status', 'Done'),
    supabase
      .from('revision_sessions')
      .select('subject_id, duration_minutes')
      .in('subject_id', subjectIds)
      .eq('status', 'Planned')
      .gte('date', today),
  ]);

  const doneSessions = doneResult.data ?? [];
  const plannedSessions = plannedResult.data ?? [];

  const doneBySubject: Record<string, number> = {};
  const plannedBySubject: Record<string, number> = {};

  for (const s of doneSessions) {
    doneBySubject[s.subject_id] = (doneBySubject[s.subject_id] ?? 0) + s.duration_minutes;
  }
  for (const s of plannedSessions) {
    plannedBySubject[s.subject_id] = (plannedBySubject[s.subject_id] ?? 0) + s.duration_minutes;
  }

  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Exam countdown</h1>
        <p className="text-gray-500 mt-1">
          Subjects sorted by nearest upcoming exam · planned = future sessions · completed = all done sessions
        </p>
      </div>
      <ExamOverviewTable
        subjects={subjects}
        doneBySubject={doneBySubject}
        plannedBySubject={plannedBySubject}
      />
    </PageWrapper>
  );
}
