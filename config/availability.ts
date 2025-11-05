import { DateTime } from 'luxon';

export type TimeRange = {
  start: string; // HH:mm
  end: string; // HH:mm
};

export type WeeklyAvailability = {
  [weekday in number]?: TimeRange[];
};

export const DEFAULT_TIMEZONE = 'Europe/Paris';

export const AVAILABILITY_WINDOW_DAYS = 21;

export const WEEKLY_AVAILABILITY: WeeklyAvailability = {
  1: [
    { start: '09:30', end: '12:30' },
    { start: '14:00', end: '18:00' }
  ],
  2: [
    { start: '09:30', end: '12:30' },
    { start: '14:00', end: '18:00' }
  ],
  4: [
    { start: '09:30', end: '12:30' },
    { start: '14:00', end: '17:00' }
  ],
  6: [{ start: '10:00', end: '14:00' }]
};

export const BLOCKED_DATES: string[] = [];

export const SLOT_INTERVAL_MINUTES = 30;

export function parseTime(time: string, date: DateTime) {
  const [hour, minute] = time.split(':').map(Number);
  return date.set({ hour, minute, second: 0, millisecond: 0 });
}
