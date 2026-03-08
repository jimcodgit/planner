import { createClient } from '@/lib/supabase/server';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { notFound } from 'next/navigation';
import { sortByPriority } from '@/lib/logic/priority';
import { SubjectDetailClient } from './SubjectDetailClient';

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const [subjectResult, topicsResult] = await Promise.all([
    supabase.from('subjects').select('*').eq('id', id).single(),
    supabase.from('topics').select('*').eq('subject_id', id).order('name'),
  ]);

  if (!subjectResult.data) notFound();

  const subject = subjectResult.data;
  const topics = topicsResult.data ?? [];
  const sortedTopics = sortByPriority(topics, subject.exam_dates);

  return (
    <PageWrapper>
      <SubjectDetailClient
        subject={subject}
        topics={sortedTopics}
        isParent={profile?.role === 'parent'}
      />
    </PageWrapper>
  );
}
