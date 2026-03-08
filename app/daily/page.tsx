import { createClient } from '@/lib/supabase/server';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { TodaysSessions } from '@/components/dashboard/TodaysSessions';
import { getDailyWarnings } from '@/lib/logic/warnings';
import { toISODate } from '@/lib/utils/dates';

export default async function DailyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = toISODate(new Date());

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isParent = profile?.role === 'parent';

  let sessionsQuery = supabase
    .from('revision_sessions')
    .select('*')
    .eq('date', today)
    .order('start_time');

  if (!isParent) {
    sessionsQuery = sessionsQuery.eq('user_id', user.id);
  }

  const { data: sessions } = await sessionsQuery;

  const subjectIds = Array.from(new Set((sessions ?? []).map((s) => s.subject_id)));
  const topicIds = Array.from(
    new Set((sessions ?? []).filter((s) => s.topic_id).map((s) => s.topic_id!))
  );

  const [subjectsResult, topicsResult] = await Promise.all([
    supabase.from('subjects').select('*').in('id', subjectIds.length > 0 ? subjectIds : ['x']),
    supabase.from('topics').select('*').in('id', topicIds.length > 0 ? topicIds : ['x']),
  ]);

  const subjectsById: Record<string, NonNullable<typeof subjectsResult.data>[0]> = {};
  const topicsById: Record<string, NonNullable<typeof topicsResult.data>[0]> = {};
  for (const s of subjectsResult.data ?? []) subjectsById[s.id] = s;
  for (const t of topicsResult.data ?? []) topicsById[t.id] = t;

  const warnings = getDailyWarnings(sessions ?? []);

  const totalMinutes = (sessions ?? [])
    .filter((s) => s.status === 'Done')
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  return (
    <PageWrapper title={`Today — ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`}>
      {warnings.map((w, i) => (
        <div key={i} className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
          ⚠️ {w.message}
        </div>
      ))}

      {totalMinutes > 0 && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-800">
          ✓ {Math.round(totalMinutes / 60 * 10) / 10}h completed today
        </div>
      )}

      <TodaysSessions
        sessions={sessions ?? []}
        subjectsById={subjectsById}
        topicsById={topicsById}
      />
    </PageWrapper>
  );
}
