import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { getWeekDays, toISODate } from '@/lib/utils/dates';
import { buildTimeline } from '@/lib/logic/timeline';
import { PrintButton } from '@/components/subjects/report/PrintButton';
import { WallTimeline } from '@/components/reports/WallTimeline';
import { WallSubjectGrid } from '@/components/reports/WallSubjectGrid';
import { WallHeatmap } from '@/components/reports/WallHeatmap';
import { WallTargetBars } from '@/components/reports/WallTargetBars';
import { WallMilestoneStrip } from '@/components/reports/WallMilestoneStrip';
import type { Topic, RevisionSession } from '@/types/database';

export const metadata = { title: 'Wall Report | GCSE Planner' };

export default async function WallReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single();

  const isParent = profile?.role === 'parent';

  const today = new Date();
  const weekDays = getWeekDays(today);
  const weekStart = toISODate(weekDays[0]);
  const weekEnd = toISODate(weekDays[6]);

  let subjectsQuery = supabase.from('subjects').select('*').order('name');
  if (!isParent) subjectsQuery = subjectsQuery.eq('user_id', user.id);

  const { data: subjects } = await subjectsQuery;

  if (!subjects || subjects.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center text-gray-400">
        <p className="text-lg font-medium text-gray-500">No subjects yet</p>
        <p className="text-sm mt-1">Add subjects to generate a wall report.</p>
      </div>
    );
  }

  const subjectIds = subjects.map((s) => s.id);

  const [topicsResult, sessionsResult] = await Promise.all([
    supabase.from('topics').select('*').in('subject_id', subjectIds),
    supabase
      .from('revision_sessions')
      .select('*')
      .in('subject_id', subjectIds)
      .gte('date', weekStart)
      .lte('date', weekEnd),
  ]);

  const allTopics: Topic[] = topicsResult.data ?? [];
  const allSessions: RevisionSession[] = sessionsResult.data ?? [];

  // Index topics and sessions by subject
  const topicsBySubject: Record<string, Topic[]> = {};
  for (const t of allTopics) {
    topicsBySubject[t.subject_id] = [...(topicsBySubject[t.subject_id] ?? []), t];
  }

  const sessionsBySubject: Record<string, RevisionSession[]> = {};
  for (const s of allSessions) {
    sessionsBySubject[s.subject_id] = [...(sessionsBySubject[s.subject_id] ?? []), s];
  }

  const timeline = buildTimeline(subjects, today);

  const totalTopics = allTopics.length;
  const confidentTopics = allTopics.filter((t) => t.status === 'Confident').length;

  const printDate = format(today, 'd MMM yyyy');
  const studentName = isParent ? 'Student' : (profile?.display_name ?? 'Student');

  return (
    <>
      <style>{`
        @media print {
          .print-hidden { display: none !important; }
          body { margin: 0; padding: 0; background: white; }
          @page { size: A4 portrait; margin: 12mm; }
        }
      `}</style>

      {/* Screen nav */}
      <div className="print-hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/subjects" className="text-sm text-indigo-600 hover:underline">← Subjects</a>
          <span className="text-sm font-medium text-gray-700">Wall Report</span>
        </div>
        <PrintButton />
      </div>

      {/* Report body — A4 width */}
      <div className="max-w-[740px] mx-auto px-6 py-4 space-y-4 bg-white">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div>
            <h1 className="text-base font-bold text-gray-900">GCSE Revision · {studentName}</h1>
            <p className="text-gray-400" style={{ fontSize: '9px' }}>Printed {printDate}</p>
          </div>
          <p className="text-amber-500 font-medium print-hidden" style={{ fontSize: '9px' }}>
            Reprint every Sunday to keep this up to date.
          </p>
          <p className="text-amber-500 font-medium hidden print:block" style={{ fontSize: '9px' }}>
            Reprint every Sunday to keep this up to date.
          </p>
        </div>

        {/* Section 1 — Exam Timeline */}
        {timeline ? (
          <section>
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Exam Timeline</h2>
            <WallTimeline timeline={timeline} />
          </section>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 text-xs text-amber-700">
            No upcoming exam dates — add exam dates to subjects to see the timeline.
          </div>
        )}

        {/* Section 2 — Subject Status Grid */}
        <section>
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Subject Status</h2>
          <WallSubjectGrid subjects={subjects} topicsBySubject={topicsBySubject} />
          <div className="flex items-center gap-4 mt-1.5" style={{ fontSize: '8px', color: '#9ca3af' }}>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> ≥60% confident</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 30–59% confident</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> &lt;30% confident</span>
          </div>
        </section>

        {/* Section 3 — Topic Urgency Heatmap */}
        {allTopics.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Topic Urgency Heatmap</h2>
            <WallHeatmap subjects={subjects} topicsBySubject={topicsBySubject} />
          </section>
        )}

        {/* Section 4 — This Week's Targets */}
        <section>
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
            This Week's Targets
            <span className="ml-2 font-normal text-gray-400 normal-case">
              {format(weekDays[0], 'd MMM')} – {format(weekDays[6], 'd MMM')}
            </span>
          </h2>
          <WallTargetBars
            subjects={subjects}
            sessionsBySubject={sessionsBySubject}
            weekStart={weekStart}
            weekEnd={weekEnd}
          />
          <div className="flex items-center gap-4 mt-1.5" style={{ fontSize: '8px', color: '#9ca3af' }}>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-green-500" /> Done</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-indigo-300" /> Planned</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-gray-100" /> Remaining</span>
          </div>
        </section>

        {/* Section 5 — Overall Milestone Strip */}
        {totalTopics > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Overall Progress</h2>
            <WallMilestoneStrip
              totalTopics={totalTopics}
              confidentTopics={confidentTopics}
              subjectCount={subjects.length}
            />
          </section>
        )}
      </div>
    </>
  );
}
