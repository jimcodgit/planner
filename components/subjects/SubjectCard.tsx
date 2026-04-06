'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SessionTypeIcon } from '@/components/ui/SessionTypeIcon';
import type { Subject, Topic } from '@/types/database';
import { minutesToHours } from '@/lib/utils/time';
import { daysUntil, formatShortDate } from '@/lib/utils/dates';

const SESSION_TYPES = [
  { value: 'Topic Review',       short: 'Review' },
  { value: 'Practice Questions', short: 'Questions' },
  { value: 'Practice Paper',     short: 'Paper' },
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
  const inProgressCount = topics.filter((t) => t.status === 'Wobbly' || t.status === 'Brush Up').length;
  const pctConfident = topics.length > 0 ? Math.round((confidentCount / topics.length) * 100) : 0;
  const pctInProgress = topics.length > 0 ? Math.round((inProgressCount / topics.length) * 100) : 0;

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

  const confidenceColor =
    pctConfident >= 60 ? 'text-green-600' : pctConfident >= 30 ? 'text-amber-500' : 'text-red-500';

  return (
    <Link href={`/subjects/${subject.id}`}>
      <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer h-full">
        <CardContent className="py-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                style={{ backgroundColor: subject.color }}
              />
              <div className="min-w-0">
                <span className="font-semibold text-gray-900 text-sm leading-tight block truncate">
                  {subject.name}
                </span>
                {subject.exam_board && (
                  <span className="text-xs text-gray-400">{subject.exam_board}</span>
                )}
              </div>
            </div>
            {nextExam && (
              <Badge variant={examBadgeVariant}>
                {nextExam.days === 0 ? 'Today!' : nextExam.days === 1 ? 'Tomorrow' : `${nextExam.days}d`}
              </Badge>
            )}
          </div>

          {/* Hero stat — confidence */}
          <div className="flex items-end justify-between mb-1">
            <div>
              <span className={`text-3xl font-bold leading-none ${confidenceColor}`}>
                {pctConfident}%
              </span>
              <span className="text-xs text-gray-400 ml-1.5">confident</span>
            </div>
            <span className="text-sm font-semibold text-gray-700">{minutesToHours(weekDoneMinutes)}</span>
          </div>
          <div className="text-xs text-gray-400 mb-2">
            {confidentCount}/{topics.length} topics · this week
          </div>

          {/* Stacked progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2.5 flex overflow-hidden mb-3">
            <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${pctConfident}%` }} />
            <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${pctInProgress}%` }} />
          </div>

          {/* Session type row */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            {SESSION_TYPES.map(({ value, short }) => {
              const done = completedByType[value] ?? 0;
              const planned = plannedByType[value] ?? 0;
              if (done === 0 && planned === 0) return null;
              return (
                <div key={value} className="flex items-center gap-1 text-xs text-gray-500">
                  <SessionTypeIcon type={value} size={13} className="text-gray-400" />
                  <span className="font-medium text-gray-700">{minutesToHours(done)}</span>
                  {planned > 0 && (
                    <span className="text-gray-400">/ {minutesToHours(planned)}</span>
                  )}
                </div>
              );
            })}
          </div>

          {nextExam && (
            <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
              {nextExam.label} · {formatShortDate(nextExam.date)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
