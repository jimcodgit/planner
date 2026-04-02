import { cn } from '@/lib/utils/cn';
import { formatDisplayDate } from '@/lib/utils/dates';
import type { Topic, RevisionSession, ExamDate, SessionType } from '@/types/database';
import { computeUrgency, type UrgencyLevel } from '@/lib/logic/urgency';

const SESSION_MIX_TYPES: { type: SessionType; icon: string; label: string }[] = [
  { type: 'Topic Review', icon: '📖', label: 'Topic Review' },
  { type: 'Practice Questions', icon: '✍️', label: 'Practice Q' },
  { type: 'Practice Paper', icon: '📝', label: 'Practice Paper' },
];

const URGENCY_CLASSES: Record<UrgencyLevel, string> = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-orange-100 text-orange-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-gray-100 text-gray-600',
};

const STATUS_CLASSES: Record<string, string> = {
  'Confident': 'bg-green-100 text-green-800',
  'Revising': 'bg-blue-100 text-blue-800',
  'Learning': 'bg-amber-100 text-amber-800',
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

  // Aggregate per-topic session stats
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
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="pb-2 pr-4 font-medium">Topic</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 pr-4 font-medium">Difficulty</th>
              <th className="pb-2 pr-4 font-medium">Last Revised</th>
              <th className="pb-2 pr-4 font-medium text-center">Done</th>
              <th className="pb-2 pr-4 font-medium text-center">Planned</th>
              <th className="pb-2 pr-4 font-medium">Session Mix</th>
              <th className="pb-2 font-medium">Urgency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {enriched.map((topic) => (
              <tr key={topic.id} className="group">
                <td className="py-2.5 pr-4">
                  <span className="font-medium text-gray-900">{topic.name}</span>
                  {topic.priority === 'High' && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                      High
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-4">
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', STATUS_CLASSES[topic.status])}>
                    {topic.status}
                  </span>
                  {topic.difficulty >= 4 && topic.status === 'Confident' && (
                    <span
                      className="ml-1 text-amber-500 cursor-help"
                      title="High difficulty — worth double-checking your confidence here."
                    >
                      ⚠️
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-4">
                  <span className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={cn('w-2 h-2 rounded-full', i < topic.difficulty ? 'bg-gray-700' : 'bg-gray-200')}
                      />
                    ))}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-xs">
                  {topic.last_revised_at ? (
                    <span className="text-gray-600">{formatDisplayDate(topic.last_revised_at)}</span>
                  ) : (
                    <span className="text-red-500 font-medium">Never</span>
                  )}
                </td>
                <td className="py-2.5 pr-4 text-center text-gray-700 font-medium">
                  {topic.doneCount}
                </td>
                <td className="py-2.5 pr-4 text-center text-gray-700 font-medium">
                  {topic.plannedCount}
                  {topic.totalSkipped > 2 && (
                    <span
                      className="ml-1 text-amber-500 cursor-help"
                      title={`${topic.totalSkipped} sessions skipped — may need attention`}
                    >
                      ⚠
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-4">
                  <span className="flex gap-1.5">
                    {SESSION_MIX_TYPES.map(({ type, icon, label }) => (
                      <span
                        key={type}
                        className={cn(
                          'text-base cursor-help',
                          (topic.doneByType[type] ?? 0) > 0 ? 'opacity-100' : 'opacity-20',
                        )}
                        title={`${label}: ${topic.doneByType[type] ?? 0} done`}
                      >
                        {icon}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="py-2.5">
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', URGENCY_CLASSES[topic.urgency])}>
                    {topic.urgency}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {enriched.map((topic) => (
          <div key={topic.id} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="font-medium text-gray-900 text-sm">{topic.name}</span>
                {topic.priority === 'High' && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                    High
                  </span>
                )}
              </div>
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0', URGENCY_CLASSES[topic.urgency])}>
                {topic.urgency}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', STATUS_CLASSES[topic.status])}>
                {topic.status}
              </span>
              {topic.difficulty >= 4 && topic.status === 'Confident' && (
                <span className="text-amber-500 text-xs" title="High difficulty — worth double-checking">⚠️</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Last revised:{' '}
              {topic.last_revised_at ? (
                formatDisplayDate(topic.last_revised_at)
              ) : (
                <span className="text-red-500 font-medium">Never</span>
              )}
            </p>
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer text-indigo-600 font-medium">Details</summary>
              <div className="mt-2 space-y-1 pl-1">
                <p>Difficulty: {Array.from({ length: 5 }).map((_, i) => i < topic.difficulty ? '●' : '○').join('')}</p>
                <p>Sessions done: {topic.doneCount} · Planned: {topic.plannedCount}</p>
                {topic.totalSkipped > 2 && <p className="text-amber-600">⚠ {topic.totalSkipped} sessions skipped</p>}
                <p>
                  Session mix:{' '}
                  {SESSION_MIX_TYPES.map(({ type, icon, label }) => (
                    <span key={type} className={cn('mr-1', (topic.doneByType[type] ?? 0) === 0 ? 'opacity-30' : '')} title={`${label}: ${topic.doneByType[type] ?? 0}`}>
                      {icon}
                    </span>
                  ))}
                </p>
              </div>
            </details>
          </div>
        ))}
      </div>
    </>
  );
}
