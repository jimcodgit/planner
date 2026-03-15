'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import type { Subject, Topic } from '@/types/database';
import { minutesToHours } from '@/lib/utils/time';
import { daysUntil, formatShortDate } from '@/lib/utils/dates';

const SESSION_TYPES = [
  { value: 'Topic Review',       icon: '📖', short: 'Topic Review' },
  { value: 'Practice Questions', icon: '✍️', short: 'Practice Q' },
  { value: 'Practice Paper',     icon: '📝', short: 'Practice Paper' },
] as const;

interface SubjectCardProps {
  subject: Subject;
  topics: Topic[];
  weekDoneMinutes: number;
  completedByType: Record<string, number>;
  plannedByType: Record<string, number>;
}

export function SubjectCard({
  subject,
  topics,
  weekDoneMinutes,
  completedByType,
  plannedByType,
}: SubjectCardProps) {
  const confidentCount = topics.filter((t) => t.status === 'Confident').length;
  const pctConfident = topics.length > 0 ? Math.round((confidentCount / topics.length) * 100) : 0;

  const nextExam = subject.exam_dates
    .map((ed) => ({ ...ed, days: daysUntil(ed.date) }))
    .filter((ed) => ed.days >= 0)
    .sort((a, b) => a.days - b.days)[0];

  const examBadgeVariant = !nextExam
    ? 'gray'
    : nextExam.days < 7
    ? 'red'
    : nextExam.days < 30
    ? 'yellow'
    : 'green';

  return (
    <Link href={`/subjects/${subject.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="py-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: subject.color }}
              />
              <span className="font-semibold text-gray-900 truncate">{subject.name}</span>
              {subject.exam_board && (
                <Badge variant="gray">{subject.exam_board}</Badge>
              )}
            </div>
            {nextExam && (
              <Badge variant={examBadgeVariant}>
                {nextExam.days === 0 ? 'Today!' : nextExam.days === 1 ? 'Tomorrow' : `${nextExam.days}d`}
              </Badge>
            )}
          </div>

          {/* Top stats */}
          <div className="grid grid-cols-3 gap-3 text-center mb-3">
            <div>
              <div className="text-lg font-bold text-gray-900">{pctConfident}%</div>
              <div className="text-xs text-gray-500">Confident</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{minutesToHours(weekDoneMinutes)}</div>
              <div className="text-xs text-gray-500">This week</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{topics.length}</div>
              <div className="text-xs text-gray-500">Topics</div>
            </div>
          </div>

          <ProgressBar value={pctConfident} />

          {/* Session type breakdown */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-3 text-xs font-medium mb-1.5">
              <span className="text-gray-400"></span>
              <span className="text-center text-green-600">Done</span>
              <span className="text-center text-indigo-600">Planned</span>
            </div>
            {SESSION_TYPES.map(({ value, icon, short }) => (
              <div key={value} className="grid grid-cols-3 items-center text-xs py-0.5">
                <span className="text-gray-500 flex items-center gap-1">
                  <span>{icon}</span>
                  <span>{short}</span>
                </span>
                <span className="text-center font-medium text-gray-700">
                  {minutesToHours(completedByType[value] ?? 0)}
                </span>
                <span className="text-center font-medium text-gray-500">
                  {minutesToHours(plannedByType[value] ?? 0)}
                </span>
              </div>
            ))}
          </div>

          {nextExam && (
            <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
              Next: {nextExam.label} — {formatShortDate(nextExam.date)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
