import { DateTime, Interval } from 'luxon';
import { SERVICES } from '@/config/services';
import {
  AVAILABILITY_WINDOW_DAYS,
  BLOCKED_DATES,
  DEFAULT_TIMEZONE,
  SLOT_INTERVAL_MINUTES,
  WEEKLY_AVAILABILITY,
  parseTime
} from '@/config/availability';
import { getBookingsBetween } from './db';
import type { BookingRecord } from './types';

export type AvailabilitySlot = {
  startISO: string;
  endISO: string;
};

export type AvailabilityByDay = {
  date: string; // ISO date (yyyy-mm-dd)
  weekdayLabel: string;
  slots: AvailabilitySlot[];
};

export function computeAvailability(options: {
  serviceId: string;
  from?: string;
  days?: number;
  timezone?: string;
}): AvailabilityByDay[] {
  const { serviceId, from, days, timezone = DEFAULT_TIMEZONE } = options;
  const service = SERVICES.find((svc) => svc.id === serviceId);

  if (!service) {
    throw new Error('Service non reconnu');
  }

  const startDate = from
    ? DateTime.fromISO(from, { zone: timezone }).startOf('day')
    : DateTime.now().setZone(timezone).startOf('day');
  const windowDays = Math.min(days ?? AVAILABILITY_WINDOW_DAYS, 60);
  const endDate = startDate.plus({ days: windowDays }).endOf('day');
  const now = DateTime.now().setZone(timezone);

  const bookings = getBookingsBetween(startDate.toUTC().toISO(), endDate.toUTC().toISO()).filter(
    (booking) => booking.paymentStatus !== 'cancelled'
  );

  const grouped: AvailabilityByDay[] = [];

  for (let cursor = startDate; cursor <= endDate; cursor = cursor.plus({ days: 1 })) {
    if (cursor < DateTime.now().setZone(timezone).startOf('day')) {
      continue;
    }

    if (BLOCKED_DATES.includes(cursor.toISODate() ?? '')) {
      continue;
    }

    const weekdayRanges = WEEKLY_AVAILABILITY[cursor.weekday];

    if (!weekdayRanges || weekdayRanges.length === 0) {
      continue;
    }

    const dayBookings = bookings
      .filter((booking) => DateTime.fromISO(booking.startISO).setZone(timezone).hasSame(cursor, 'day'))
      .map((booking) =>
        Interval.fromDateTimes(
          DateTime.fromISO(booking.startISO).setZone(timezone),
          DateTime.fromISO(booking.endISO).setZone(timezone)
        )
      );

    const daySlots: AvailabilitySlot[] = [];

    weekdayRanges.forEach((range) => {
      const rangeStart = parseTime(range.start, cursor);
      const rangeEnd = parseTime(range.end, cursor);

      let slotCursor = rangeStart;
      while (slotCursor.plus({ minutes: service.durationMinutes }) <= rangeEnd.plus({ minutes: 0.5 })) {
        const slotEnd = slotCursor.plus({ minutes: service.durationMinutes });

        if (slotEnd > rangeEnd) {
          break;
        }

        const slotInterval = Interval.fromDateTimes(slotCursor, slotEnd);
        const overlaps = dayBookings.some((interval) => interval.overlaps(slotInterval));

        if (!overlaps && slotStartAfterNow(slotCursor, slotEnd, now)) {
          daySlots.push({
            startISO: slotCursor.toUTC().toISO(),
            endISO: slotEnd.toUTC().toISO()
          });
        }

        slotCursor = slotCursor.plus({ minutes: SLOT_INTERVAL_MINUTES });
      }
    });

    if (daySlots.length > 0) {
      grouped.push({
        date: cursor.toISODate() ?? '',
        weekdayLabel: cursor.setLocale('fr').toFormat('cccc d LLLL'),
        slots: daySlots
      });
    }
  }

  return grouped;
}

function slotStartAfterNow(start: DateTime, end: DateTime, now: DateTime) {
  return end > now;
}

export function findSlot(slots: AvailabilityByDay[], startISO: string) {
  for (const day of slots) {
    for (const slot of day.slots) {
      if (slot.startISO === startISO) {
        return slot;
      }
    }
  }
  return undefined;
}

export function getBookingOverlap(
  booking: BookingRecord,
  timezone: string = DEFAULT_TIMEZONE
) {
  return Interval.fromDateTimes(
    DateTime.fromISO(booking.startISO).setZone(timezone),
    DateTime.fromISO(booking.endISO).setZone(timezone)
  );
}
