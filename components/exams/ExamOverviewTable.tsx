import type { Subject } from '@/types/database';
import { daysUntil, formatDisplayDate } from '@/lib/utils/dates';
import { minutesToHours } from '@/lib/utils/time';
import { Badge } from '@/components/ui/Badge';

interface ExamOverviewTableProps {
  subjects: Subject[];
  doneBySubject: Record<string, number>;
  plannedBySubject: Record<string, number>;
}

export function ExamOverviewTable({ subjects, doneBySubject, plannedBySubject }: ExamOverviewTableProps) {
  const sorted = [...subjects].sort((a, b) => {
    const aNext = a.exam_dates
      .filter((e) => daysUntil(e.date) >= 0)
      .sort((x, y) => daysUntil(x.date) - daysUntil(y.date))[0];
    const bNext = b.exam_dates
      .filter((e) => daysUntil(e.date) >= 0)
      .sort((x, y) => daysUntil(x.date) - daysUntil(y.date))[0];
    if (!aNext && !bNext) return 0;
    if (!aNext) return 1;
    if (!bNext) return -1;
    return daysUntil(aNext.date) - daysUntil(bNext.date);
  });

  return (
    <div className="space-y-3">
      {sorted.map((subject) => {
        const done = doneBySubject[subject.id] ?? 0;
        const planned = plannedBySubject[subject.id] ?? 0;
        const upcomingExams = subject.exam_dates
          .filter((e) => daysUntil(e.date) >= 0)
          .sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
        const pastExams = subject.exam_dates.filter((e) => daysUntil(e.date) < 0);

        return (
          <div key={subject.id} className="bg-white rounded-xl border border-gray-200 p-4">
            {/* Subject header + totals */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: subject.color }}
                />
                <h2 className="font-semibold text-gray-900 truncate">{subject.name}</h2>
                {subject.exam_board && (
                  <span className="text-xs text-gray-400 flex-shrink-0">{subject.exam_board}</span>
                )}
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-center">
                  <div className="text-sm font-semibold text-green-600">{minutesToHours(done)}</div>
                  <div className="text-xs text-gray-400">completed</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-indigo-600">{minutesToHours(planned)}</div>
                  <div className="text-xs text-gray-400">planned</div>
                </div>
              </div>
            </div>

            {/* Exam dates */}
            {subject.exam_dates.length === 0 ? (
              <p className="text-xs text-gray-400 mt-2">No exam dates set</p>
            ) : (
              <div className="mt-3 divide-y divide-gray-100">
                {upcomingExams.map((ed, i) => {
                  const days = daysUntil(ed.date);
                  const badgeVariant =
                    days === 0 ? 'red' : days < 7 ? 'red' : days < 30 ? 'yellow' : 'green';
                  return (
                    <div key={i} className="flex items-center justify-between py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-800 font-medium">{ed.label || 'Exam'}</span>
                        {ed.time && (
                          <span className="text-xs text-gray-400">🕐 {ed.time}</span>
                        )}
                        {ed.duration_minutes && (
                          <span className="text-xs text-gray-400">
                            ⏱ {minutesToHours(ed.duration_minutes)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{formatDisplayDate(ed.date)}</span>
                        <Badge variant={badgeVariant}>
                          {days === 0 ? 'Today!' : `${days}d`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {pastExams.map((ed, i) => (
                  <div
                    key={`past-${i}`}
                    className="flex items-center justify-between py-2 text-sm opacity-40"
                  >
                    <span className="text-gray-600">{ed.label || 'Exam'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{formatDisplayDate(ed.date)}</span>
                      <Badge variant="gray">Past</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
