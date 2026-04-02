import type { RevisionSession, ExamDate } from '@/types/database';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  format,
  isSameMonth,
  parseISO,
  differenceInDays,
} from 'date-fns';

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isPast: boolean;
  isToday: boolean;
  isExamDay: boolean;
  examLabel?: string;
  isUnplannedPreExam: boolean;
  plannedSessions: RevisionSession[];
  doneSessions: RevisionSession[];
  skippedSessions: RevisionSession[];
  totalPlannedMinutes: number;
  isOverloaded: boolean;
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarMonth {
  label: string;
  weeks: CalendarWeek[];
}

export function buildCalendarMonths(
  startDate: Date,
  endDate: Date,
  sessionsByDate: Map<string, RevisionSession[]>,
  examDates: ExamDate[],
  today: Date,
): CalendarMonth[] {
  const todayStr = format(today, 'yyyy-MM-dd');
  const examDateSet = new Set(examDates.map((ed) => ed.date));
  const examLabelByDate = new Map(examDates.map((ed) => [ed.date, ed.label]));

  const upcomingExamDays = examDates
    .map((ed) => ed.date)
    .filter((d) => d >= todayStr)
    .sort();
  const earliestExam = upcomingExamDays[0] ?? null;

  const months: CalendarMonth[] = [];
  let cursor = startOfMonth(startDate);
  const lastMonth = startOfMonth(endDate);

  while (cursor <= lastMonth) {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

    const days: CalendarDay[] = allDays.map((d) => {
      const dateStr = format(d, 'yyyy-MM-dd');
      const sessionsOnDay = sessionsByDate.get(dateStr) ?? [];
      const plannedSessions = sessionsOnDay.filter((s) => s.status === 'Planned');
      const doneSessions = sessionsOnDay.filter((s) => s.status === 'Done');
      const skippedSessions = sessionsOnDay.filter((s) => s.status === 'Skipped');
      const totalPlannedMinutes = plannedSessions.reduce(
        (sum, s) => sum + s.duration_minutes,
        0,
      );

      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;

      const isUnplannedPreExam =
        isFuture &&
        sessionsOnDay.length === 0 &&
        earliestExam !== null &&
        dateStr <= earliestExam &&
        differenceInDays(parseISO(earliestExam), parseISO(dateStr)) <= 14;

      return {
        date: dateStr,
        isCurrentMonth: isSameMonth(d, cursor),
        isPast,
        isToday,
        isExamDay: examDateSet.has(dateStr),
        examLabel: examLabelByDate.get(dateStr),
        isUnplannedPreExam,
        plannedSessions,
        doneSessions,
        skippedSessions,
        totalPlannedMinutes,
        isOverloaded: totalPlannedMinutes > 180,
      };
    });

    const weeks: CalendarWeek[] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push({ days: days.slice(i, i + 7) });
    }

    months.push({ label: format(cursor, 'MMMM yyyy'), weeks });
    cursor = addMonths(cursor, 1);
  }

  return months;
}
