'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import type { Subject, Topic, RevisionSession } from '@/types/database';
import { minutesToHours } from '@/lib/utils/time';
import { daysUntil, formatShortDate } from '@/lib/utils/dates';

interface SubjectCardProps {
  subject: Subject;
  topics: Topic[];
  sessionsThisWeek: RevisionSession[];
}

export function SubjectCard({ subject, topics, sessionsThisWeek }: SubjectCardProps) {
  const confidentCount = topics.filter((t) => t.status === 'Confident').length;
  const pctConfident = topics.length > 0 ? Math.round((confidentCount / topics.length) * 100) : 0;

  const doneMinutes = sessionsThisWeek
    .filter((s) => s.status === 'Done')
    .reduce((sum, s) => sum + s.duration_minutes, 0);

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
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="py-3">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: subject.color }}
              />
              <span className="font-semibold text-gray-900">{subject.name}</span>
              {subject.exam_board && (
                <Badge variant="gray">{subject.exam_board}</Badge>
              )}
            </div>
            {nextExam && (
              <Badge variant={examBadgeVariant}>
                {nextExam.days === 0
                  ? 'Today!'
                  : nextExam.days === 1
                  ? 'Tomorrow'
                  : `${nextExam.days}d`}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 text-center mb-3">
            <div>
              <div className="text-lg font-bold text-gray-900">{pctConfident}%</div>
              <div className="text-xs text-gray-500">Confident</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{minutesToHours(doneMinutes)}</div>
              <div className="text-xs text-gray-500">This week</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{topics.length}</div>
              <div className="text-xs text-gray-500">Topics</div>
            </div>
          </div>

          <ProgressBar value={pctConfident} />

          {nextExam && (
            <p className="text-xs text-gray-400 mt-2">
              {nextExam.label}: {formatShortDate(nextExam.date)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
