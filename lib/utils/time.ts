export function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

export function formatTime(timeString: string | null): string {
  if (!timeString) return '';
  // timeString is HH:MM:SS or HH:MM
  return timeString.slice(0, 5);
}
