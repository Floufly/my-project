import { NextRequest, NextResponse } from 'next/server';
import { scanCity, BUSINESS_CATEGORIES } from '@/lib/scanner';
import { getAllBusinesses, getBusinessesWithoutSite, getScanStats } from '@/lib/scanner-db';

export const maxDuration = 300; // 5 min max (Vercel)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? 'stats';

  if (action === 'stats') {
    const stats = getScanStats();
    return NextResponse.json(stats);
  }

  if (action === 'list') {
    const city = searchParams.get('city') ?? undefined;
    const noWebsiteOnly = searchParams.get('noWebsite') === '1';
    const businesses = noWebsiteOnly
      ? getBusinessesWithoutSite(city)
      : getAllBusinesses(city);
    return NextResponse.json(businesses);
  }

  return NextResponse.json({ error: 'action invalide' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_MAPS_API_KEY manquante dans .env' }, { status: 500 });
  }

  const body = await req.json();
  const { city, categories } = body as { city: string; categories?: string[] };

  if (!city) {
    return NextResponse.json({ error: 'city est requis' }, { status: 400 });
  }

  const cats = categories ?? BUSINESS_CATEGORIES.slice(0, 5);

  try {
    const result = await scanCity(city, cats, apiKey);
    return NextResponse.json({
      success: true,
      city,
      ...result,
      message: `${result.found} commerces trouvés, ${result.noWebsite} sans site web`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
