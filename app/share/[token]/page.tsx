import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Subject, Topic, RevisionSession } from '@/types/database';
import { toISODate, getWeekDays } from '@/lib/utils/dates';
import { computeStreak } from '@/lib/logic/streak';
import { differenceInDays } from 'date-fns';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Look up the token (anon access — service_role not needed; RLS allows reading via token match in a separate public query)
  // We use a direct select; RLS on share_tokens only allows owner SELECT, so we need to bypass for this public route.
  // Use the admin client via service role or check in a function. For simplicity here we select without auth filter,
  // but RLS will block unless we use service role. We'll do a workaround: use a Supabase RPC or just expose
  // share_tokens SELECT to anon for the token column lookup.
  // Actually: we'll just use the server client which has the session cookie — if user is logged in they can see it.
  // For public access we need a different approach. Let's use the supabase admin client pattern.

  // For now: fetch token row. RLS blocks anon — use service role key via env
  // Fall back gracefully if SUPABASE_SERVICE_ROLE_KEY is not set.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    // Graceful fallback — show a notice
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Shared progress view is not configured.</p>
      </div>
    );
  }

  const { createClient: createServiceClient } = await import('@supabase/supabase-js');
  const admin = createServiceClient(supabaseUrl, serviceKey);

  const { data: tokenRow } = await admin
    .from('share_tokens')
    .select('user_id')
    .eq('token', token)
    .single();

  if (!tokenRow) notFound();

  const studentId = tokenRow.user_id as string;

  const today = toISODate(new Date());
  const weekDays = getWeekDays(new Date());
  const weekStart = toISODate(weekDays[0]);
  const weekEnd = toISODate(weekDays[6]);

  const [profileResult, subjectsResult, sessionsResult, allSessionsResult] = await Promise.all([
    admin.from('profiles').select('display_name').eq('id', studentId).single(),
    admin.from('subjects').select('*').eq('user_id', studentId).order('name'),
    admin
      .from('revision_sessions')
      .select('*')
      .eq('user_id', studentId)
      .gte('date', weekStart)
      .lte('date', weekEnd),
    admin
      .from('revision_sessions')
      .select('date, status')
      .eq('user_id', studentId)
      .gte('date', toISODate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000))),
  ]);

  const displayName = profileResult.data?.display_name ?? 'Student';
  const subjects = (subjectsResult.data ?? []) as Subject[];
  const weekSessions = (sessionsResult.data ?? []) as RevisionSession[];
  const allSessions = (allSessionsResult.data ?? []) as { date: string; status: string }[];

  const topicIds = Array.from(new Set(subjects.map((s) => s.id)));
  const topicsResult = await admin.from('topics').select('*').in('subject_id', topicIds.length > 0 ? topicIds : ['x']);
  const topics = (topicsResult.data ?? []) as Topic[];

  const streak = computeStreak(allSessions as Parameters<typeof computeStreak>[0]);

  const doneMinutes = weekSessions
    .filter((s) => s.status === 'Done')
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  const confidenceBySubject = subjects.map((s) => {
    const subjectTopics = topics.filter((t) => t.subject_id === s.id);
    const confident = subjectTopics.filter((t) => t.status === 'Confident').length;
    const pct = subjectTopics.length > 0 ? Math.round((confident / subjectTopics.length) * 100) : 0;
    const nextExam = (s.exam_dates ?? [])
      .map((e) => ({ ...e, days: differenceInDays(new Date(e.date), new Date()) }))
      .filter((e) => e.days >= 0)
      .sort((a, b) => a.days - b.days)[0];
    return { subject: s, pct, topicCount: subjectTopics.length, nextExam };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg mb-1">
            📚 Revision Progress
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{displayName}&apos;s Progress</h1>
          <p className="text-gray-500 text-sm mt-1">
            Week of {weekDays[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
            {' · '}read-only shared view
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">This week</p>
            <p className="text-2xl font-bold text-gray-900">{Math.round(doneMinutes / 60 * 10) / 10}h</p>
            <p className="text-xs text-gray-400">completed</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Streak</p>
            <p className="text-2xl font-bold text-gray-900">{streak}</p>
            <p className="text-xs text-gray-400">days</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {confidenceBySubject.map(({ subject, pct, topicCount, nextExam }) => (
            <div key={subject.id} className="flex items-center gap-4 px-4 py-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900 text-sm">{subject.name}</span>
                  <span className="text-sm font-semibold text-gray-700">{pct}%</span>
                </div>
                <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct >= 60 ? '#22c55e' : pct >= 30 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {topicCount} topics · confident
                  {nextExam && ` · ${nextExam.days}d to ${nextExam.label}`}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          This is a read-only shared view. No login required.
        </p>
      </div>
    </div>
  );
}
