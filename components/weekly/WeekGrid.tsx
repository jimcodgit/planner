'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DayColumn } from './DayColumn';
import type { RevisionSession, Subject, Topic } from '@/types/database';
import { getWeekDays, toISODate, format, addWeeks, subWeeks } from '@/lib/utils/dates';
import { CopyWeekButton } from './CopyWeekButton';
import { minutesToHours } from '@/lib/utils/time';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface WeekGridProps {
  initialSessions: RevisionSession[];
  subjects: Subject[];
  topicsBySubject: Record<string, Topic[]>;
  topicsById: Record<string, Topic>;
  subjectsById: Record<string, Subject>;
  weeklyTargetMinutes: number;
  isParent: boolean;
}

export function WeekGrid({
  initialSessions,
  subjects,
  topicsBySubject,
  topicsById,
  subjectsById,
  weeklyTargetMinutes,
  isParent,
}: WeekGridProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [sessions] = useState(initialSessions);

  const baseDate = new Date();
  const currentWeekDate =
    weekOffset === 0
      ? baseDate
      : weekOffset > 0
      ? addWeeks(baseDate, weekOffset)
      : subWeeks(baseDate, Math.abs(weekOffset));

  const weekDays = getWeekDays(currentWeekDate);

  const doneMins = sessions
    .filter((s) => s.status === 'Done')
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  const plannedMins = sessions
    .filter((s) => s.status === 'Planned' || s.status === 'Done')
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  const progressPct = weeklyTargetMinutes > 0
    ? Math.min(100, Math.round((doneMins / weeklyTargetMinutes) * 100))
    : 0;

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={() => setWeekOffset((o) => o - 1)}>
          ← Prev
        </Button>
        <div className="text-center">
          <div className="font-semibold text-gray-900">
            {format(weekDays[0], 'd MMM')} – {format(weekDays[6], 'd MMM yyyy')}
          </div>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-indigo-600 hover:underline"
            >
              Back to this week
            </button>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={() => setWeekOffset((o) => o + 1)}>
          Next →
        </Button>
      </div>

      {/* Copy previous week */}
      {!isParent && (
        <div className="flex justify-end">
          <CopyWeekButton
            targetWeekStart={toISODate(weekDays[0])}
            previousWeekStart={toISODate(getWeekDays(subWeeks(currentWeekDate, 1))[0])}
          />
        </div>
      )}

      {/* Progress summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-gray-600">
            {minutesToHours(doneMins)} done · {minutesToHours(plannedMins)} planned
          </span>
          <span className="font-medium text-gray-900">
            Target: {minutesToHours(weeklyTargetMinutes)}
          </span>
        </div>
        <ProgressBar
          value={progressPct}
          colorClass={progressPct >= 100 ? 'bg-green-500' : 'bg-indigo-500'}
        />
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => {
          const dateStr = toISODate(day);
          const daySessions = sessions.filter((s) => s.date === dateStr);
          return (
            <DayColumn
              key={dateStr}
              date={dateStr}
              sessions={daySessions}
              subjects={subjects}
              topicsBySubject={topicsBySubject}
              topicsById={topicsById}
              subjectsById={subjectsById}
              isParent={isParent}
            />
          );
        })}
      </div>
    </div>
  );
}
