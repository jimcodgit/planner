import { createClient } from '@/lib/supabase/server';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { PastPapersClient } from './PastPapersClient';
import type { PastPaperAttempt, Subject } from '@/types/database';

export default async function PastPapersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isParent = profile?.role === 'parent';

  let subjectsQuery = supabase.from('subjects').select('*').order('name');
  if (!isParent) subjectsQuery = subjectsQuery.eq('user_id', user.id);

  let attemptsQuery = supabase
    .from('past_paper_attempts')
    .select('*')
    .order('attempted_date', { ascending: false });
  if (!isParent) attemptsQuery = attemptsQuery.eq('user_id', user.id);

  const [subjectsResult, attemptsResult] = await Promise.all([subjectsQuery, attemptsQuery]);

  const subjects = (subjectsResult.data ?? []) as Subject[];
  const attempts = (attemptsResult.data ?? []) as PastPaperAttempt[];

  const subjectsById: Record<string, Subject> = {};
  for (const s of subjects) subjectsById[s.id] = s;

  return (
    <PageWrapper title="Past Papers">
      <p className="text-sm text-gray-500 mb-6">
        Track your past paper attempts and monitor score progress over time.
      </p>
      <PastPapersClient
        attempts={attempts}
        subjects={subjects}
        subjectsById={subjectsById}
        isParent={isParent}
      />
    </PageWrapper>
  );
}
