import type { Subject, ExamDate } from '@/types/database';
import { parseISO, differenceInDays, addDays, format, startOfWeek } from 'date-fns';

export interface TimelineWeek {
  startDate: string; // YYYY-MM-DD
  label: string;     // e.g. "12 May"
  daysFromStart: number;
}

export interface ExamMarker {
  date: string;
  subjectName: string;
  examLabel: string;
  color: string;
  daysFromStart: number;
  stackAbove: boolean; // alternating label placement to avoid overlap
}

export interface RevisionWindow {
  color: string;
  windowStartDays: number; // days from timeline start
  examDays: number;        // days from timeline start
}

export interface Timeline {
  startDate: string;
  endDate: string;
  totalDays: number;
  weeks: TimelineWeek[];
  examMarkers: ExamMarker[];
  revisionWindows: RevisionWindow[];
}

export function buildTimeline(subjects: Subject[], today: Date): Timeline | null {
  const todayStr = format(today, 'yyyy-MM-dd');

  // Collect all future exam dates across all subjects
  const allExams: { date: string; label: string; subject: Subject; examDate: ExamDate }[] = [];
  for (const subject of subjects) {
    for (const ed of (subject.exam_dates as ExamDate[])) {
      if (ed.date >= todayStr) {
        allExams.push({ date: ed.date, label: ed.label, subject, examDate: ed });
      }
    }
  }

  if (allExams.length === 0) return null;

  allExams.sort((a, b) => a.date.localeCompare(b.date));
  const lastExamDate = allExams[allExams.length - 1].date;

  const startDate = todayStr;
  const endDate = lastExamDate;
  const totalDays = differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;

  // Build week markers
  const weeks: TimelineWeek[] = [];
  let weekCursor = startOfWeek(today, { weekStartsOn: 1 });
  while (format(weekCursor, 'yyyy-MM-dd') <= endDate) {
    const weekStr = format(weekCursor, 'yyyy-MM-dd');
    const daysFromStart = differenceInDays(weekCursor, parseISO(startDate));
    if (daysFromStart >= 0) {
      weeks.push({
        startDate: weekStr,
        label: format(weekCursor, 'd MMM'),
        daysFromStart,
      });
    }
    weekCursor = addDays(weekCursor, 7);
  }

  // Build exam markers, alternating stackAbove to prevent label overlap
  const examMarkers: ExamMarker[] = allExams.map((ex, i) => ({
    date: ex.date,
    subjectName: ex.subject.name,
    examLabel: ex.label,
    color: ex.subject.color,
    daysFromStart: differenceInDays(parseISO(ex.date), parseISO(startDate)),
    stackAbove: i % 2 === 0,
  }));

  // Revision windows: 21 days before each exam
  const revisionWindows: RevisionWindow[] = allExams.map((ex) => {
    const examDays = differenceInDays(parseISO(ex.date), parseISO(startDate));
    const windowStartDays = Math.max(0, examDays - 21);
    return { color: ex.subject.color, windowStartDays, examDays };
  });

  return { startDate, endDate, totalDays, weeks, examMarkers, revisionWindows };
}
