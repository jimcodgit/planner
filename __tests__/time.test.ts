import { minutesToHours, hoursToMinutes, formatTime } from '@/lib/utils/time';

describe('minutesToHours', () => {
  it('returns minutes only when under 60', () => {
    expect(minutesToHours(30)).toBe('30m');
    expect(minutesToHours(45)).toBe('45m');
  });

  it('returns hours only when no remainder', () => {
    expect(minutesToHours(60)).toBe('1h');
    expect(minutesToHours(120)).toBe('2h');
  });

  it('returns hours and minutes when both present', () => {
    expect(minutesToHours(90)).toBe('1h 30m');
    expect(minutesToHours(75)).toBe('1h 15m');
    expect(minutesToHours(135)).toBe('2h 15m');
  });

  it('handles zero', () => {
    expect(minutesToHours(0)).toBe('0m');
  });
});

describe('hoursToMinutes', () => {
  it('converts whole hours', () => {
    expect(hoursToMinutes(1)).toBe(60);
    expect(hoursToMinutes(2)).toBe(120);
  });

  it('converts fractional hours', () => {
    expect(hoursToMinutes(1.5)).toBe(90);
    expect(hoursToMinutes(0.5)).toBe(30);
  });
});

describe('formatTime', () => {
  it('returns empty string for null', () => {
    expect(formatTime(null)).toBe('');
  });

  it('trims seconds from HH:MM:SS', () => {
    expect(formatTime('09:30:00')).toBe('09:30');
    expect(formatTime('14:00:00')).toBe('14:00');
  });

  it('returns HH:MM unchanged', () => {
    expect(formatTime('09:30')).toBe('09:30');
  });
});
