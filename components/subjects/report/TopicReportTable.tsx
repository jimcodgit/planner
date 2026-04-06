import { cn } from '@/lib/utils/cn';
import { formatDisplayDate } from '@/lib/utils/dates';
import type { Topic, RevisionSession, ExamDate, SessionType } from '@/types/database';
import { computeUrgency, type UrgencyLevel } from '@/lib/logic/urgency';
import { SessionTypeIcon } from '@/components/ui/SessionTypeIcon';

const SESSION_MIX_TYPES: { type: SessionType; label: string }[] = [
  { type: 'Topic Review',       label: 'Review' },
  { type: 'Practice Questions', label: 'Questions' },
  { type: 'Practice Paper',     label: 'Paper' },
];

const URGENCY_CLASSES: Record<UrgencyLevel, string> = {
  Critical: 'bg-red-100 text-red-800',
  High:     'bg-orange-100 text-orange-800',
  Medium:   'bg-yellow-100 text-yellow-800',
  Low:      'bg-gray-100 text-gray-600',
};

const STATUS_CLASSES: Record<string, string> = {
  'Confident':   'bg-green-100 text-green-800',
  'Brush Up':    'bg-yellow-100 text-yellow-800',
  'Wobbly':      'bg-orange-100 text-orange-800',
  'Not Started': 'bg-gray-100 text-gray-600',
};

interface TopicWithStats extends Topic {
  urgency: UrgencyLevel;
  doneCount: number;
  plannedCount: number;
  doneByType: Record<string, number>;
  totalSkipped: number;
}

interface TopicReportTableProps {
  topics: Topic[];
  sessions: RevisionSession[];
  examDates: ExamDate[];
}

export function TopicReportTable({ topics, sessions, examDates }: TopicReportTableProps) {
  const today = new Date().toISOString().split('T')[0];

  const statsByTopic: Record<string, {
    doneCount: number;
    plannedCount: number;
    doneByType: Record<string, number>;
    totalSkipped: number;
  }> = {};

  for (const s of sessions) {
    if (!s.topic_id) continue;
    if (!statsByTopic[s.topic_id]) {
      statsByTopic[s.topic_id] = { doneCount: 0, plannedCount: 0, doneByType: {}, totalSkipped: 0 };
    }
    const st = statsByTopic[s.topic_id];
    if (s.status === 'Done') {
      st.doneCount++;
      st.doneByType[s.type] = (st.doneByType[s.type] ?? 0) + 1;
    }
    if (s.status === 'Planned' && s.date >= today) {
      st.plannedCount++;
    }
    st.totalSkipped += s.skipped_count;
  }

  const enriched: TopicWithStats[] = topics.map((t) => ({
    ...t,
    urgency: computeUrgency(t, examDates),
    doneCount: statsByTopic[t.id]?.doneCount ?? 0,
    plannedCount: statsByTopic[t.id]?.plannedCount ?? 0,
    doneByType: statsByTopic[t.id]?.doneByType ?? {},
    totalSkipped: statsByTopic[t.id]?.totalSkipped ?? 0,
  }));

  const urgencyOrder: Record<UrgencyLevel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  enriched.sort((a, b) => {
    const diff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-2">
      {enriched.map((topic) => (
        <div key={topic.id} className="border border-gray-200 rounded-lg p-3">
          {/* Row 1: name + urgency */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="font-medium text-gray-900 text-sm">{topic.name}</span>
              {topic.priority === 'High' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                  High
                </span>
              )}
            </div>
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0', URGENCY_CLASSES[topic.urgency])}>
              {topic.urgency}
            </span>
          </div>

          {/* Row 2: status + difficulty */}
          <div className="flex items-center gap-3 mb-2">
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', STATUS_CLASSES[topic.status])}>
              {topic.status}
              {topic.difficulty >= 4 && topic.status === 'Confident' && (
                <span className="ml-1" title="High difficulty — worth double-checking your confidence here.">⚠️</span>
              )}
            </span>
            <span className="flex gap-0.5" title={`Difficulty: ${topic.difficulty}/5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={cn('w-2 h-2 rounded-full', i < topic.difficulty ? 'bg-gray-700' : 'bg-gray-200')} />
              ))}
            </span>
          </div>

          {/* Row 3: stats */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>
              Last revised:{' '}
              {topic.last_revised_at ? (
                <span className="text-gray-700">{formatDisplayDate(topic.last_revised_at)}</span>
              ) : (
                <span className="text-red-500 font-medium">Never</span>
              )}
            </span>
            <span>Done: <span className="text-gray-700 font-medium">{topic.doneCount}</span></span>
            <span>
              Planned: <span className="text-gray-700 font-medium">{topic.plannedCount}</span>
              {topic.totalSkipped > 2 && (
                <span className="ml-1 text-amber-500" title={`${topic.totalSkipped} sessions skipped — may need attention`}>⚠</span>
              )}
            </span>
            <span className="flex items-center gap-1">
              Mix:{' '}
              {SESSION_MIX_TYPES.map(({ type, label }) => (
                <span
                  key={type}
                  className={cn((topic.doneByType[type] ?? 0) > 0 ? 'opacity-100 text-gray-600' : 'opacity-20 text-gray-400')}
                  title={`${label}: ${topic.doneByType[type] ?? 0} done`}
                >
                  <SessionTypeIcon type={type} size={14} />
                </span>
              ))}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
