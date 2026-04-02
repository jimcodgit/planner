import { cn } from '@/lib/utils/cn';
import type { Subject, Topic, ExamDate } from '@/types/database';
import { computeUrgency, type UrgencyLevel } from '@/lib/logic/urgency';

const MAX_TOPICS = 15;

const CELL_COLOR: Record<UrgencyLevel, string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-400',
  Medium: 'bg-yellow-300',
  Low: 'bg-green-400',
};

const NOT_STARTED_COLOR = 'bg-gray-200';
const CONFIDENT_COLOR = 'bg-green-400';

function abbreviate(name: string, len = 8): string {
  return name.length <= len ? name : name.slice(0, len - 1) + '…';
}

interface WallHeatmapProps {
  subjects: Subject[];
  topicsBySubject: Record<string, Topic[]>;
}

export function WallHeatmap({ subjects, topicsBySubject }: WallHeatmapProps) {
  return (
    <div className="space-y-1">
      {subjects.map((subject) => {
        const allTopics = topicsBySubject[subject.id] ?? [];
        if (allTopics.length === 0) return null;

        const examDates = subject.exam_dates as ExamDate[];

        // Sort by urgency desc, then show up to MAX_TOPICS
        const sorted = [...allTopics].sort((a, b) => {
          const order: Record<UrgencyLevel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
          const ua = a.status === 'Confident' ? 4 : order[computeUrgency(a, examDates)];
          const ub = b.status === 'Confident' ? 4 : order[computeUrgency(b, examDates)];
          return ua - ub;
        });

        const visible = sorted.slice(0, MAX_TOPICS);
        const overflow = sorted.length - visible.length;

        return (
          <div key={subject.id} className="flex items-center gap-2">
            {/* Subject label */}
            <div className="flex items-center gap-1 flex-shrink-0" style={{ width: '80px' }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
              <span className="text-gray-700 font-medium truncate" style={{ fontSize: '9px' }}>
                {abbreviate(subject.name, 10)}
              </span>
            </div>

            {/* Topic cells */}
            <div className="flex items-center gap-0.5 flex-wrap">
              {visible.map((topic) => {
                const isConfident = topic.status === 'Confident';
                const isNotStarted = topic.status === 'Not Started';
                const urgency = (!isConfident && !isNotStarted)
                  ? computeUrgency(topic, examDates)
                  : null;

                const cellClass = isConfident
                  ? CONFIDENT_COLOR
                  : isNotStarted
                  ? NOT_STARTED_COLOR
                  : urgency
                  ? CELL_COLOR[urgency]
                  : NOT_STARTED_COLOR;

                return (
                  <div
                    key={topic.id}
                    className={cn('rounded-sm flex-shrink-0', cellClass)}
                    style={{ width: '16px', height: '16px' }}
                    title={topic.name}
                  />
                );
              })}
              {overflow > 0 && (
                <span className="text-gray-400 ml-1" style={{ fontSize: '8px' }}>+{overflow}</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-3 pt-1 border-t border-gray-100 mt-2" style={{ fontSize: '8px', color: '#6b7280' }}>
        {[
          { color: 'bg-red-500', label: 'Critical' },
          { color: 'bg-orange-400', label: 'High' },
          { color: 'bg-yellow-300', label: 'Medium' },
          { color: 'bg-green-400', label: 'On track' },
          { color: 'bg-gray-200', label: 'Not started' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1">
            <span className={cn('inline-block rounded-sm flex-shrink-0', color)} style={{ width: '10px', height: '10px' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
