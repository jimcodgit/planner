import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import type { Topic, RevisionSession, ExamDate } from '@/types/database';
import { computeSuggestedSession, type UrgencyLevel } from '@/lib/logic/urgency';

const URGENCY_CLASSES: Record<UrgencyLevel, string> = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-orange-100 text-orange-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-gray-100 text-gray-600',
};

interface WhatToDoNextProps {
  topics: Topic[];
  sessions: RevisionSession[];
  examDates: ExamDate[];
  subjectId: string;
  isParent: boolean;
  studentName?: string;
}

export function WhatToDoNext({
  topics,
  sessions,
  examDates,
  subjectId,
  isParent,
  studentName,
}: WhatToDoNextProps) {
  const suggestion = computeSuggestedSession(topics, sessions, examDates);

  if (!suggestion) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-xl px-5 py-4 text-sm text-green-800 font-medium">
        ✓ All urgent topics have sessions planned — well done.
      </div>
    );
  }

  return (
    <div className="border-2 border-indigo-200 bg-indigo-50 rounded-xl px-5 py-4">
      <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Suggested next session</p>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm">{suggestion.topic.name}</span>
          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', URGENCY_CLASSES[suggestion.urgency])}>
            {suggestion.urgency}
          </span>
          <span className="text-sm text-gray-500">· Topic Review · 45 min</span>
        </div>
        {isParent ? (
          <span className="text-xs text-gray-500 italic">
            Ask {studentName ?? 'the student'} to schedule this.
          </span>
        ) : (
          <Link
            href={`/daily?subject=${subjectId}&topic=${suggestion.topic.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add session →
          </Link>
        )}
      </div>
    </div>
  );
}
