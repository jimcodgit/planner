import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PrintButton } from '@/components/subjects/report/PrintButton';
import { TopicReportTable } from '@/components/subjects/report/TopicReportTable';
import { WhatToDoNext } from '@/components/subjects/report/WhatToDoNext';
import { RevisionSchedule } from '@/components/subjects/report/RevisionSchedule';
import { ExamCalendar } from '@/components/subjects/report/ExamCalendar';
import { SessionAccordion } from '@/components/subjects/report/SessionAccordion';
import { daysUntil } from '@/lib/utils/dates';
import { computeUrgency } from '@/lib/logic/urgency';
import type { ExamDate } from '@/types/database';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: subject } = await supabase.from('subjects').select('name').eq('id', id).single();
  return { title: subject ? `${subject.name} Report | GCSE Planner` : 'Report | GCSE Planner' };
}

export default async function SubjectReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [subjectResult, topicsResult, sessionsResult, profileResult, parentTargetResult] =
    await Promise.all([
      supabase.from('subjects').select('*').eq('id', id).single(),
      supabase.from('topics').select('*').eq('subject_id', id).order('name'),
      supabase
        .from('revision_sessions')
        .select('*')
        .eq('subject_id', id)
        .order('date', { ascending: false }),
      supabase.from('profiles').select('role, display_name').eq('id', user.id).single(),
      supabase.from('weekly_targets').select('*').eq('subject_id', id).maybeSingle(),
    ]);

  if (!subjectResult.data) notFound();

  const subject = subjectResult.data;

  // Parent can see any subject; student can only see their own
  const isParent = profileResult.data?.role === 'parent';
  if (!isParent && subject.user_id !== user.id) notFound();

  const topics = topicsResult.data ?? [];
  const sessions = sessionsResult.data ?? [];
  const parentTarget = parentTargetResult.data ?? null;

  const hasExamDates = subject.exam_dates.length > 0;
  const hasTopics = topics.length > 0;
  const today = new Date();

  const confidentCount = topics.filter((t) => t.status === 'Confident').length;
  const inProgressCount = topics.filter((t) => t.status === 'Wobbly' || t.status === 'Brush Up').length;
  const notStartedCount = topics.filter((t) => t.status === 'Not Started').length;
  const pctConfident = topics.length > 0 ? Math.round((confidentCount / topics.length) * 100) : 0;
  const pctInProgress = topics.length > 0 ? Math.round((inProgressCount / topics.length) * 100) : 0;

  const neverRevisedCount = topics.filter(
    (t) => !t.last_revised_at && t.status !== 'Not Started',
  ).length;

  const recentlyConfident = topics.filter((t) => {
    if (t.status !== 'Confident' || !t.last_revised_at) return false;
    return daysUntil(t.last_revised_at.split('T')[0]) >= -30;
  }).length;

  // Sort topics by urgency for the report
  const sortedTopics = [...topics].sort((a, b) => {
    const urgencyOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    const ua = urgencyOrder[computeUrgency(a, subject.exam_dates)];
    const ub = urgencyOrder[computeUrgency(b, subject.exam_dates)];
    return ua !== ub ? ua - ub : a.name.localeCompare(b.name);
  });

  const upcomingExams = (subject.exam_dates as ExamDate[])
    .map((ed) => ({ ...ed, days: daysUntil(ed.date) }))
    .filter((ed) => ed.days >= 0)
    .sort((a, b) => a.days - b.days);

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          nav, header, .print\\:hidden { display: none !important; }
          details { display: block !important; }
          details > * { display: block !important; }
          body { font-size: 12px; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Back link + print */}
        <div className="flex items-center justify-between print:hidden">
          <Link href={`/subjects/${id}`} className="text-sm text-indigo-600 hover:underline">
            ← Back to {subject.name}
          </Link>
          <PrintButton />
        </div>

        {/* Section 1 — Subject Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
            <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
            {subject.exam_board && <Badge variant="gray">{subject.exam_board}</Badge>}
          </div>
          {upcomingExams.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {upcomingExams.map((ed, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    ed.days <= 7
                      ? 'bg-red-100 text-red-800'
                      : ed.days <= 14
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {ed.label} — {ed.days === 0 ? 'Today' : ed.days === 1 ? 'Tomorrow' : `${ed.days} days`}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Empty state: no topics */}
        {!hasTopics && (
          <div className="border border-gray-200 rounded-xl px-6 py-10 text-center text-gray-400">
            <p className="text-lg font-medium text-gray-500">No topics added yet</p>
            <p className="text-sm mt-1">
              <Link href={`/subjects/${id}`} className="text-indigo-600 hover:underline">
                Add topics to this subject
              </Link>{' '}
              to see your report.
            </p>
          </div>
        )}

        {hasTopics && (
          <>
            {/* Section 2 — Confidence Overview */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Topic Confidence</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Stacked bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
                  <div className="h-3 bg-green-500 transition-all" style={{ width: `${pctConfident}%` }} />
                  <div className="h-3 bg-amber-400 transition-all" style={{ width: `${pctInProgress}%` }} />
                </div>
                {/* Stats */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    Confident: <strong>{confidentCount}</strong> ({pctConfident}%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    In Progress: <strong>{inProgressCount}</strong> ({pctInProgress}%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                    Not Started: <strong>{notStartedCount}</strong>
                  </span>
                </div>
                {/* Trend */}
                {recentlyConfident > 0 ? (
                  <p className="text-sm text-green-600 font-medium">
                    ↑ {recentlyConfident} topic{recentlyConfident > 1 ? 's' : ''} moved to Confident in the last 30 days
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">No topics moved to Confident in the last 30 days</p>
                )}
                {/* Never revised warning */}
                {neverRevisedCount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
                    ⚠️ {neverRevisedCount} topic{neverRevisedCount > 1 ? 's' : ''} started but never revised
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 3 — Per-Topic Table */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Topics ({topics.length})</h2>
              </CardHeader>
              <CardContent>
                <TopicReportTable topics={sortedTopics} sessions={sessions} examDates={subject.exam_dates} />
              </CardContent>
            </Card>

            {/* Section 4 — What to Do Next */}
            <WhatToDoNext
              topics={topics}
              sessions={sessions}
              examDates={subject.exam_dates}
              subjectId={id}
              isParent={isParent}
              studentName={isParent ? undefined : profileResult.data?.display_name}
            />

            {/* No exam dates warning (for schedule sections) */}
            {!hasExamDates && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
                ⚠️ No exam dates added yet —{' '}
                <Link href={`/subjects/${id}`} className="underline font-medium">
                  add exam dates
                </Link>{' '}
                to unlock the revision schedule and calendar.
              </div>
            )}

            {hasExamDates && (
              <>
                {/* Section 5 — Revision Gap Analysis */}
                <Card>
                  <CardHeader>
                    <h2 className="font-semibold text-gray-900">Revision Schedule</h2>
                  </CardHeader>
                  <CardContent>
                    <RevisionSchedule
                      topics={topics}
                      sessions={sessions}
                      examDates={subject.exam_dates}
                      subjectWeeklyTargetHours={subject.weekly_target_hours}
                      parentTarget={parentTarget}
                      isParent={isParent}
                    />
                  </CardContent>
                </Card>

                {/* Section 6 — Exam Countdown Calendar */}
                <Card>
                  <CardHeader>
                    <h2 className="font-semibold text-gray-900">Exam Countdown Calendar</h2>
                  </CardHeader>
                  <CardContent>
                    <ExamCalendar
                      sessions={sessions}
                      examDates={subject.exam_dates}
                      today={today}
                    />
                  </CardContent>
                </Card>
              </>
            )}

            {/* Section 7 — Session History */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Session History by Topic</h2>
              </CardHeader>
              <CardContent>
                <SessionAccordion topics={sortedTopics} sessions={sessions} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
