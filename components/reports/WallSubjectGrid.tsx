import { cn } from '@/lib/utils/cn';
import { daysUntil } from '@/lib/utils/dates';
import type { Subject, Topic, ExamDate } from '@/types/database';

interface WallSubjectGridProps {
  subjects: Subject[];
  topicsBySubject: Record<string, Topic[]>;
}

export function WallSubjectGrid({ subjects, topicsBySubject }: WallSubjectGridProps) {
  return (
    <div className="border border-gray-200 rounded overflow-hidden">
      {subjects.map((subject, i) => {
        const topics = topicsBySubject[subject.id] ?? [];
        const confident = topics.filter((t) => t.status === 'Confident').length;
        const inProgress = topics.filter((t) => t.status === 'Learning' || t.status === 'Revising').length;
        const notStarted = topics.filter((t) => t.status === 'Not Started').length;
        const total = topics.length;

        const pctConfident = total > 0 ? (confident / total) * 100 : 0;
        const pctInProgress = total > 0 ? (inProgress / total) * 100 : 0;

        const examDates = (subject.exam_dates as ExamDate[])
          .map((ed) => ({ ...ed, days: daysUntil(ed.date) }))
          .filter((ed) => ed.days >= 0)
          .sort((a, b) => a.days - b.days);

        const nearestExam = examDates[0] ?? null;

        const trafficLight =
          pctConfident >= 60 ? 'bg-green-500' :
          pctConfident >= 30 ? 'bg-amber-400' :
          'bg-red-500';

        const daysBadge =
          !nearestExam ? 'bg-gray-100 text-gray-400' :
          nearestExam.days <= 7 ? 'bg-red-100 text-red-700' :
          nearestExam.days <= 21 ? 'bg-amber-100 text-amber-700' :
          'bg-gray-100 text-gray-600';

        return (
          <div
            key={subject.id}
            className={cn('flex items-center gap-3 px-3 py-2', i > 0 && 'border-t border-gray-100')}
          >
            {/* Traffic light */}
            <div className={cn('w-3 h-3 rounded-full flex-shrink-0', trafficLight)} />

            {/* Subject name */}
            <div className="w-36 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                <span className="text-xs font-semibold text-gray-900 truncate">{subject.name}</span>
              </div>
              {subject.exam_board && (
                <span className="text-gray-400 ml-3.5" style={{ fontSize: '9px' }}>{subject.exam_board}</span>
              )}
            </div>

            {/* Confidence bar */}
            <div className="flex-1">
              <div className="w-full bg-gray-100 rounded-full h-3 flex overflow-hidden">
                <div className="h-3 bg-green-500" style={{ width: `${pctConfident}%` }} />
                <div className="h-3 bg-amber-400" style={{ width: `${pctInProgress}%` }} />
              </div>
              <div className="flex gap-3 mt-0.5" style={{ fontSize: '8px', color: '#9ca3af' }}>
                <span><span className="text-green-600 font-medium">{confident}</span> confident</span>
                <span><span className="text-amber-500 font-medium">{inProgress}</span> in progress</span>
                <span><span className="text-gray-500 font-medium">{notStarted}</span> not started</span>
              </div>
            </div>

            {/* Days to exam */}
            <div className="flex-shrink-0 text-right">
              {nearestExam ? (
                <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium', daysBadge)}>
                  {nearestExam.days === 0 ? 'Today' : `${nearestExam.days}d`}
                </span>
              ) : (
                <span className="text-gray-300 text-xs">No exam</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
