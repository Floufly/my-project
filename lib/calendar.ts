import { google } from 'googleapis';
import { createEvent } from 'ics';
import { DateTime } from 'luxon';
import type { BookingRecord } from './types';
import { SERVICES } from '@/config/services';
import { DEFAULT_TIMEZONE } from '@/config/availability';

type CalendarInsertResult = {
  provider: 'google';
  eventId: string;
};

export type CalendarResult = CalendarInsertResult | undefined;

function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!clientEmail || !privateKey || !calendarId) {
    return undefined;
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar']
  });

  return { auth, calendarId };
}

export async function pushBookingToCalendar(
  booking: BookingRecord,
  options?: { timezone?: string }
): Promise<CalendarResult> {
  const googleConfig = getGoogleAuth();
  if (!googleConfig) {
    return undefined;
  }

  const service = SERVICES.find((svc) => svc.id === booking.serviceId);
  const summary = service
    ? `Consultation numérologie — ${service.title}`
    : 'Consultation de numérologie';

  const timezone = options?.timezone ?? DEFAULT_TIMEZONE;

  const start = DateTime.fromISO(booking.startISO).setZone(timezone);
  const end = DateTime.fromISO(booking.endISO).setZone(timezone);

  const calendar = google.calendar({ version: 'v3', auth: googleConfig.auth });
  const response = await calendar.events.insert({
    calendarId: googleConfig.calendarId,
    requestBody: {
      summary,
      description: `Client: ${booking.name}\nEmail: ${booking.email}\nTéléphone: ${booking.phone ?? '—'}\nNotes: ${booking.notes ?? '—'}`,
      start: {
        dateTime: start.toISO(),
        timeZone: timezone
      },
      end: {
        dateTime: end.toISO(),
        timeZone: timezone
      }
    }
  });

  return response.data.id
    ? {
        provider: 'google',
        eventId: response.data.id
      }
    : undefined;
}

export function buildIcsEvent(booking: BookingRecord, options?: { timezone?: string }) {
  const timezone = options?.timezone ?? DEFAULT_TIMEZONE;
  const service = SERVICES.find((svc) => svc.id === booking.serviceId);
  const start = DateTime.fromISO(booking.startISO).setZone(timezone);
  const end = DateTime.fromISO(booking.endISO).setZone(timezone);
  const organizerEmail = process.env.ORGANIZER_EMAIL ?? 'contact@numerologie-daniel.fr';

  const { value, error } = createEvent({
    title: service ? `Consultation numérologie — ${service.title}` : 'Consultation de numérologie',
    description: `Client: ${booking.name}\nEmail: ${booking.email}\nTéléphone: ${booking.phone ?? '—'}\nNotes: ${booking.notes ?? '—'}`,
    start: [start.year, start.month, start.day, start.hour, start.minute],
    end: [end.year, end.month, end.day, end.hour, end.minute],
    location: 'En ligne — lien communiqué après paiement',
    organizer: {
      name: 'Consultations de numérologie',
      email: organizerEmail
    }
  });

  if (error) {
    throw error;
  }

  return {
    filename: `consultation-${start.toFormat('yyyyLLdd-HHmm')}.ics`,
    content: value
  };
}
