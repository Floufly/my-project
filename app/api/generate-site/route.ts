import { NextRequest, NextResponse } from 'next/server';
import { generateSiteData } from '@/lib/site-generator';
import { createSite, getSiteByPlaceId, getAllSites } from '@/lib/sites-db';
import { getBusinessesWithoutSite } from '@/lib/scanner-db';
import { updateBusinessStatus } from '@/lib/scanner-db';

export async function GET() {
  const sites = getAllSites();
  return NextResponse.json(sites);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { placeId, generateAll, city } = body as { placeId?: string; generateAll?: boolean; city?: string };

  if (generateAll) {
    const businesses = getBusinessesWithoutSite(city, 50);
    let count = 0;
    for (const b of businesses) {
      const existing = getSiteByPlaceId(b.placeId);
      if (existing) continue;
      const siteData = generateSiteData(b);
      createSite(siteData);
      updateBusinessStatus(b.placeId, 'site_generated', `/sites/${siteData.slug}`);
      count++;
    }
    return NextResponse.json({ success: true, generated: count });
  }

  if (!placeId) {
    return NextResponse.json({ error: 'placeId requis' }, { status: 400 });
  }

  const businesses = getBusinessesWithoutSite();
  const business = businesses.find((b) => b.placeId === placeId);
  if (!business) {
    return NextResponse.json({ error: 'Commerce non trouvé' }, { status: 404 });
  }

  const siteData = generateSiteData(business);
  createSite(siteData);
  updateBusinessStatus(business.placeId, 'site_generated', `/sites/${siteData.slug}`);

  return NextResponse.json({ success: true, slug: siteData.slug, url: `/sites/${siteData.slug}` });
}
