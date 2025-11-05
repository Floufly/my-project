import { NextResponse } from 'next/server';
import { z } from 'zod';
import { computeAvailability } from '@/lib/availability';
import { DEFAULT_TIMEZONE } from '@/config/availability';

const querySchema = z.object({
  serviceId: z.string(),
  from: z.string().optional(),
  days: z.coerce.number().min(1).max(60).optional(),
  timezone: z.string().optional()
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    serviceId: searchParams.get('serviceId'),
    from: searchParams.get('from') ?? undefined,
    days: searchParams.get('days') ?? undefined,
    timezone: searchParams.get('timezone') ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ message: 'Paramètres invalides' }, { status: 400 });
  }

  const { serviceId, from, days, timezone } = parsed.data;

  try {
    const daysAvailability = computeAvailability({
      serviceId,
      from,
      days,
      timezone: timezone ?? DEFAULT_TIMEZONE
    });

    return NextResponse.json({ days: daysAvailability });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}
