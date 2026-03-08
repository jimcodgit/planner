import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
  differenceInDays,
  addWeeks,
  subWeeks,
  isToday,
  isSameDay,
} from 'date-fns';

export { format, parseISO, differenceInDays, isToday, isSameDay, addWeeks, subWeeks };

export function getWeekDays(date: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  });
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function daysUntil(dateString: string): number {
  return differenceInDays(parseISO(dateString), new Date());
}

export function formatDisplayDate(dateString: string): string {
  return format(parseISO(dateString), 'EEE d MMM');
}

export function formatShortDate(dateString: string): string {
  return format(parseISO(dateString), 'd MMM');
}
