import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import type { Topic, Subject } from '@/types/database';
import { differenceInDays } from 'date-fns';

interface NudgeProps {
  topics: (Topic & { subject: Subject })[];
}

const STATUS_REVIEW_DAYS: Record<string, number> = {
  'Wobbly': 3,
  'Brush Up': 7,
  'Not Started': 0, // always due
  'Confident': 21,
};

export function getTopicsDueForReview(topics: (Topic & { subject: Subject })[]): (Topic & { subject: Subject })[] {
  const now = new Date();
  return topics.filter((t) => {
    if (t.status === 'Confident') return false; // skip confident for now
    const daysThreshold = STATUS_REVIEW_DAYS[t.status] ?? 7;
    if (!t.last_revised_at) return true;
    const daysSince = differenceInDays(now, new Date(t.last_revised_at));
    return daysSince >= daysThreshold;
  }).slice(0, 5);
}

export function SpacedRepetitionNudges({ topics }: NudgeProps) {
  const due = getTopicsDueForReview(topics);

  if (due.length === 0) return null;

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <span>Due for review</span>
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {due.length}
          </span>
        </h3>
      </CardHeader>
      <CardContent className="py-1">
        <ul className="space-y-2">
          {due.map((t) => {
            const daysSince = t.last_revised_at
              ? differenceInDays(new Date(), new Date(t.last_revised_at))
              : null;
            return (
              <li key={t.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: t.subject.color }}
                    />
                    <span className="text-sm font-medium text-gray-900 truncate">{t.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-4">
                    {t.subject.name} ·{' '}
                    {daysSince === null ? 'never revised' : `${daysSince}d ago`}
                  </p>
                </div>
                <Link
                  href={`/subjects/${t.subject_id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex-shrink-0"
                >
                  Review →
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-gray-400 mt-3">
          Revisiting topics regularly helps move them to long-term memory.
        </p>
      </CardContent>
    </Card>
  );
}
