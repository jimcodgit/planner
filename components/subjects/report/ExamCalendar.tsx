import { cn } from '@/lib/utils/cn';
import { minutesToHours } from '@/lib/utils/time';
import type { RevisionSession, ExamDate } from '@/types/database';
import { buildCalendarMonths } from '@/lib/logic/calendar';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface ExamCalendarProps {
  sessions: RevisionSession[];
  examDates: ExamDate[];
  today: Date;
}

export function ExamCalendar({ sessions, examDates, today }: ExamCalendarProps) {
  const todayStr = today.toISOString().split('T')[0];

  const upcomingExams = examDates
    .map((ed) => ed.date)
    .filter((d) => d >= todayStr)
    .sort();

  if (upcomingExams.length === 0) return null;

  const lastExamDate = new Date(upcomingExams[upcomingExams.length - 1]);

  // Build sessionsByDate map
  const sessionsByDate = new Map<string, RevisionSession[]>();
  for (const s of sessions) {
    const existing = sessionsByDate.get(s.date) ?? [];
    existing.push(s);
    sessionsByDate.set(s.date, existing);
  }

  const months = buildCalendarMonths(today, lastExamDate, sessionsByDate, examDates, today);

  return (
    <div className="space-y-6">
      {months.map((month) => (
        <div key={month.label}>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">{month.label}</h4>
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden text-xs">
            {/* Day header */}
            {DAY_LABELS.map((d) => (
              <div key={d} className="bg-gray-50 text-center text-gray-400 font-medium py-1.5">
                {d}
              </div>
            ))}
            {/* Day cells */}
            {month.weeks.flatMap((week) =>
              week.days.map((day) => {
                if (!day.isCurrentMonth) {
                  return <div key={day.date} className="bg-white min-h-[40px]" />;
                }

                const hasPlanned = day.plannedSessions.length > 0;
                const hasDone = day.doneSessions.length > 0;
                const hasSkipped = day.skippedSessions.length > 0;

                const sessionTitles = [
                  ...day.plannedSessions.map((s) => `${s.type} ${minutesToHours(s.duration_minutes)} (planned)`),
                  ...day.doneSessions.map((s) => `${s.type} ${minutesToHours(s.duration_minutes)} (done)`),
                  ...day.skippedSessions.map((s) => `${s.type} (skipped)`),
                ].join('\n');

                const cellClass = cn(
                  'bg-white min-h-[40px] p-1 flex flex-col items-center justify-start',
                  day.isPast && 'opacity-40',
                  day.isExamDay && 'bg-red-500 text-white font-bold',
                  !day.isExamDay && hasPlanned && hasDone && 'bg-indigo-100',
                  !day.isExamDay && hasPlanned && !hasDone && 'bg-indigo-100',
                  !day.isExamDay && !hasPlanned && hasDone && 'bg-green-100',
                  !day.isExamDay && day.isUnplannedPreExam && 'bg-red-50',
                );

                return (
                  <div
                    key={day.date}
                    className={cellClass}
                    title={day.isExamDay ? `Exam: ${day.examLabel}${sessionTitles ? '\n' + sessionTitles : ''}` : sessionTitles || undefined}
                  >
                    <span
                      className={cn(
                        'text-xs leading-none mt-1',
                        day.isToday && 'ring-2 ring-indigo-500 rounded-full w-5 h-5 flex items-center justify-center',
                        day.isExamDay && 'text-white',
                        !day.isExamDay && day.isPast && 'text-gray-300',
                        !day.isExamDay && !day.isPast && 'text-gray-700',
                      )}
                    >
                      {parseInt(day.date.split('-')[2], 10)}
                    </span>

                    {/* Session dots */}
                    {!day.isExamDay && (hasPlanned || hasDone || hasSkipped || day.isOverloaded) && (
                      <span className="flex gap-0.5 mt-1">
                        {hasDone && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        {hasPlanned && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                        {hasSkipped && <span className="w-1.5 h-1.5 rounded-full bg-gray-400 line-through" />}
                        {day.isOverloaded && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                      </span>
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-1">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0" /> Planned session</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" /> Completed session</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 flex-shrink-0" /> Skipped session</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" /> Overloaded day (&gt;3h)</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500 flex-shrink-0" /> Exam day</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-100 flex-shrink-0" /> Unplanned (final 2 weeks)</span>
      </div>
    </div>
  );
}
