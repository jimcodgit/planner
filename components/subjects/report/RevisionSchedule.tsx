import { cn } from '@/lib/utils/cn';
import { minutesToHours } from '@/lib/utils/time';
import type { Topic, RevisionSession, ExamDate, WeeklyTarget } from '@/types/database';
import { computeGapAnalysis, type UrgencyLevel } from '@/lib/logic/urgency';

const URGENCY_CLASSES: Record<UrgencyLevel, string> = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-orange-100 text-orange-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-gray-100 text-gray-600',
};

interface RevisionScheduleProps {
  topics: Topic[];
  sessions: RevisionSession[];
  examDates: ExamDate[];
  subjectWeeklyTargetHours: number;
  parentTarget: WeeklyTarget | null;
  isParent: boolean;
}

export function RevisionSchedule({
  topics,
  sessions,
  examDates,
  subjectWeeklyTargetHours,
  parentTarget,
  isParent,
}: RevisionScheduleProps) {
  const effectiveTargetHours = parentTarget?.hours ?? subjectWeeklyTargetHours;
  const targetSource = parentTarget ? 'parent' : 'subject';

  const analysis = computeGapAnalysis(topics, sessions, examDates, effectiveTargetHours);

  if (analysis.topicGaps.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No topics need revision scheduling — all topics are confident.
      </div>
    );
  }

  const feasibilityStyle =
    analysis.feasibility === 'tight'
      ? 'text-red-600'
      : analysis.feasibility === 'achievable'
      ? 'text-green-600'
      : 'text-amber-600';

  return (
    <div className="space-y-4">
      {/* Target source note */}
      <p className="text-xs text-gray-500">
        {targetSource === 'parent' ? (
          <>
            {isParent && (
              <span className="font-medium text-gray-600">Viewing as parent — targets shown are the targets you set. </span>
            )}
            Target set by parent: <span className="font-medium">{effectiveTargetHours}h/week</span>
          </>
        ) : (
          <>Subject target: <span className="font-medium">{effectiveTargetHours}h/week</span></>
        )}
      </p>

      <div className="space-y-2">
        {analysis.topicGaps.map(({ topic, urgency, alreadyPlannedMinutes, recommendedMinutes, gap }) => (
          <div key={topic.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{topic.name}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium', URGENCY_CLASSES[urgency])}>
                  {urgency}
                </span>
                <span className="text-xs text-gray-500">
                  {minutesToHours(alreadyPlannedMinutes)} planned · {minutesToHours(recommendedMinutes)} recommended
                </span>
              </div>
            </div>
            <GapBadge gap={gap} />
          </div>
        ))}
      </div>

      {/* Feasibility + summary */}
      <div className="pt-3 border-t border-gray-100 space-y-1">
        {analysis.minutesPerDayNeeded !== null && (
          <p className={cn('text-sm font-medium', feasibilityStyle)}>
            {analysis.feasibility === 'tight'
              ? `⚠ To close all gaps you need ~${minutesToHours(analysis.minutesPerDayNeeded)}/day for ${analysis.daysToExam} days — this may not be achievable. Consider which topics to prioritise.`
              : analysis.feasibility === 'achievable'
              ? `✓ To close all gaps you need ~${minutesToHours(analysis.minutesPerDayNeeded)}/day — this is manageable.`
              : `To close all gaps you need ~${minutesToHours(analysis.minutesPerDayNeeded)}/day for the next ${analysis.daysToExam} days.`}
          </p>
        )}
        <p className="text-xs text-gray-500">
          {minutesToHours(analysis.totalPlannedMinutes)} planned ·{' '}
          {minutesToHours(analysis.totalRecommendedMinutes)} recommended across{' '}
          {analysis.topicGaps.length} topics
          {analysis.daysToExam !== null && <> · Exam in {analysis.daysToExam} days</>}
        </p>
      </div>
    </div>
  );
}

function GapBadge({ gap }: { gap: number }) {
  if (gap <= -1) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
        Over-planned
      </span>
    );
  }
  if (gap <= 5) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
        On track
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap">
      +{minutesToHours(gap)} needed
    </span>
  );
}
