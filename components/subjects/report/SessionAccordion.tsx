import { formatDisplayDate } from '@/lib/utils/dates';
import { minutesToHours } from '@/lib/utils/time';
import type { Topic, RevisionSession, SessionType } from '@/types/database';

const SESSION_TYPE_LABELS: Partial<Record<SessionType, string>> = {
  'Topic Review': 'Topic Review',
  'Practice Questions': 'Practice Q',
  'Practice Paper': 'Practice Paper',
  'Notes': 'Notes',
  'Questions': 'Questions',
  'Past Paper': 'Past Paper',
  'Flashcards': 'Flashcards',
  'Other': 'Other',
};

function groupByMonth(sessions: RevisionSession[]): { label: string; sessions: RevisionSession[] }[] {
  const groups: Record<string, RevisionSession[]> = {};
  for (const s of sessions) {
    const key = s.date.slice(0, 7); // YYYY-MM
    groups[key] = [...(groups[key] ?? []), s];
  }
  return Object.entries(groups)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, sessions]) => ({
      label: new Date(key + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      sessions,
    }));
}

interface SessionAccordionProps {
  topics: Topic[];
  sessions: RevisionSession[];
}

export function SessionAccordion({ topics, sessions }: SessionAccordionProps) {
  const sessionsByTopic: Record<string, RevisionSession[]> = {};
  for (const s of sessions) {
    if (s.topic_id && s.status === 'Done') {
      sessionsByTopic[s.topic_id] = [...(sessionsByTopic[s.topic_id] ?? []), s];
    }
  }

  // Count done sessions per type for a topic
  const typeCountsForTopic = (topicId: string): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const s of sessionsByTopic[topicId] ?? []) {
      counts[s.type] = (counts[s.type] ?? 0) + 1;
    }
    return counts;
  };

  return (
    <div className="space-y-2 print:space-y-4">
      {topics.map((topic) => {
        const done = sessionsByTopic[topic.id] ?? [];
        const typeCounts = typeCountsForTopic(topic.id);
        const typeBreakdown = Object.entries(typeCounts)
          .map(([type, count]) => `${SESSION_TYPE_LABELS[type as SessionType] ?? type}: ${count}`)
          .join(' · ');
        const monthGroups = groupByMonth(done);

        return (
          <details key={topic.id} className="border border-gray-200 rounded-lg group print:open">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 print:pointer-events-none">
              <span className="font-medium text-sm text-gray-900">{topic.name}</span>
              <span className="text-xs text-gray-400">{done.length} session{done.length !== 1 ? 's' : ''}</span>
            </summary>
            <div className="px-4 pb-4 pt-1 border-t border-gray-100">
              {done.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No completed sessions yet.</p>
              ) : (
                <>
                  {typeBreakdown && (
                    <p className="text-xs text-gray-500 mb-3">{typeBreakdown}</p>
                  )}
                  <div className="space-y-4">
                    {monthGroups.map((group) => (
                      <div key={group.label}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          {group.label}
                        </p>
                        <div className="space-y-1">
                          {group.sessions.map((s) => (
                            <div key={s.id} className="flex items-center justify-between text-xs text-gray-600">
                              <span>{formatDisplayDate(s.date)}</span>
                              <span className="text-gray-400 mx-3 flex-1 border-b border-dotted border-gray-200" />
                              <span>{SESSION_TYPE_LABELS[s.type] ?? s.type}</span>
                              <span className="ml-3 font-medium text-gray-700">{minutesToHours(s.duration_minutes)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}
