import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DateTime } from 'luxon';
import { computeAvailability, findSlot } from '@/lib/availability';
import { createBooking } from '@/lib/db';
import { initiatePayment } from '@/lib/payments';
import { buildIcsEvent, pushBookingToCalendar } from '@/lib/calendar';
import { SERVICES } from '@/config/services';
import { DEFAULT_TIMEZONE } from '@/config/availability';
import type { PaymentMethod } from '@/lib/types';

const bodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  notes: z.string().max(1000).optional(),
  serviceId: z.string(),
  slotStartISO: z.string(),
  paymentMethod: z.enum(['card', 'crypto', 'telegram'])
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const data = parsed.data;
  const service = SERVICES.find((svc) => svc.id === data.serviceId);

  if (!service) {
    return NextResponse.json({ message: 'Service introuvable' }, { status: 404 });
  }

  const slotDate = DateTime.fromISO(data.slotStartISO);
  if (!slotDate.isValid) {
    return NextResponse.json({ message: 'Créneau invalide' }, { status: 400 });
  }

  const availability = computeAvailability({
    serviceId: data.serviceId,
    from: slotDate.setZone(DEFAULT_TIMEZONE).toISODate() ?? undefined,
    days: 1
  });

  const slot = findSlot(availability, data.slotStartISO);
  if (!slot) {
    return NextResponse.json(
      { message: 'Ce créneau vient d’être réservé ou n’est plus disponible.' },
      { status: 409 }
    );
  }

  try {
    const booking = createBooking({
      name: data.name,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
      serviceId: data.serviceId,
      startISO: slot.startISO,
      endISO: slot.endISO,
      paymentMethod: data.paymentMethod as PaymentMethod
    });

    let calendarResult = null;
    try {
      calendarResult = await pushBookingToCalendar(booking, { timezone: DEFAULT_TIMEZONE });
    } catch (error) {
      console.error('Erreur calendrier', error);
    }

    let ics = null;
    try {
      ics = buildIcsEvent(booking, { timezone: DEFAULT_TIMEZONE });
    } catch (error) {
      console.error('Erreur génération ICS', error);
    }

    let paymentInfo = null;
    try {
      const origin = request.headers.get('origin') ?? new URL(request.url).origin;
      paymentInfo = await initiatePayment({
        booking,
        successUrl: origin,
        cancelUrl: origin
      });
    } catch (error) {
      console.error('Erreur init paiement', error);
    }

    return NextResponse.json({
      booking,
      message: 'Vous recevrez un e-mail récapitulatif avec le lien de connexion et le récapitulatif de paiement.',
      calendar: calendarResult ?? null,
      ics: ics ?? null,
      payment: paymentInfo ?? undefined
    });
  } catch (error) {
    console.error('Erreur de réservation', error);
    const message = error instanceof Error ? error.message : '';
    if (message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { message: 'Ce créneau a été réservé quelques instants avant vous. Merci de choisir un autre horaire.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Impossible de finaliser la réservation. Merci de réessayer.' },
      { status: 500 }
    );
  }
}
