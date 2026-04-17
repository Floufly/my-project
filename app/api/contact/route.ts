import { NextRequest, NextResponse } from 'next/server';
import { contactBusiness, type ContactChannel } from '@/lib/notifier';
import { getSiteByPlaceId, getAllSites } from '@/lib/sites-db';
import { updateBusinessStatus } from '@/lib/scanner-db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    placeId,
    contactAll,
    channels = ['sms'],
  } = body as { placeId?: string; contactAll?: boolean; channels?: ContactChannel[] };

  if (contactAll) {
    const sites = getAllSites(100);
    const toContact = sites.filter((s) => s.phone);
    let sent = 0;
    const errors: string[] = [];

    for (const site of toContact) {
      const results = await contactBusiness(site, channels);
      const anySuccess = results.some((r) => r.success);
      if (anySuccess) {
        updateBusinessStatus(site.placeId, 'contacted');
        sent++;
      } else {
        errors.push(`${site.businessName}: ${results.map((r) => r.error).join(', ')}`);
      }
      // small delay to respect API rate limits
      await new Promise((r) => setTimeout(r, 300));
    }

    return NextResponse.json({ success: true, sent, errors });
  }

  if (!placeId) {
    return NextResponse.json({ error: 'placeId requis' }, { status: 400 });
  }

  const site = getSiteByPlaceId(placeId);
  if (!site) {
    return NextResponse.json({ error: 'Site non trouvé — générez le site d\'abord' }, { status: 404 });
  }

  const results = await contactBusiness(site, channels);
  const anySuccess = results.some((r) => r.success);

  if (anySuccess) {
    updateBusinessStatus(site.placeId, 'contacted');
  }

  return NextResponse.json({ success: anySuccess, results });
}
