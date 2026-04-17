import { upsertBusiness } from './scanner-db';

const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

export const BUSINESS_CATEGORIES = [
  'restaurant', 'boulangerie', 'coiffeur', 'pharmacie', 'médecin',
  'dentiste', 'plombier', 'électricien', 'garage', 'hotel',
  'bar', 'café', 'pizzeria', 'boucherie', 'fleuriste',
  'épicerie', 'vétérinaire', 'kinésithérapeute', 'avocat', 'comptable',
];

type PlaceSearchResult = {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  types: string[];
};

type PlaceDetails = {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  types: string[];
};

async function searchPlaces(query: string, apiKey: string): Promise<PlaceSearchResult[]> {
  const url = `${PLACES_API_BASE}/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=fr`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Places API error: ${res.status}`);
  const data = await res.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API: ${data.status} - ${data.error_message ?? ''}`);
  }
  return data.results ?? [];
}

async function getPlaceDetails(placeId: string, apiKey: string): Promise<PlaceDetails> {
  const fields = 'place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types';
  const url = `${PLACES_API_BASE}/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}&language=fr`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Place Details API error: ${res.status}`);
  const data = await res.json();
  if (data.status !== 'OK') throw new Error(`Place Details: ${data.status}`);
  return data.result;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export type ScanProgress = {
  category: string;
  city: string;
  found: number;
  noWebsite: number;
  processed: number;
  total: number;
};

export async function scanCity(
  city: string,
  categories: string[],
  apiKey: string,
  onProgress?: (p: ScanProgress) => void
): Promise<{ found: number; noWebsite: number }> {
  let totalFound = 0;
  let totalNoWebsite = 0;

  for (const category of categories) {
    const query = `${category} à ${city}`;

    let places: PlaceSearchResult[] = [];
    try {
      places = await searchPlaces(query, apiKey);
    } catch (err) {
      console.error(`Scan error for "${query}":`, err);
      continue;
    }

    for (let i = 0; i < places.length; i++) {
      const place = places[i];
      await sleep(200); // respect API rate limits

      let details: PlaceDetails;
      try {
        details = await getPlaceDetails(place.place_id, apiKey);
      } catch {
        continue;
      }

      const now = new Date().toISOString();
      upsertBusiness({
        placeId: details.place_id,
        name: details.name,
        address: details.formatted_address,
        phone: details.formatted_phone_number ?? null,
        category,
        city,
        rating: details.rating ?? null,
        reviewCount: details.user_ratings_total ?? null,
        hasWebsite: !!details.website,
        websiteUrl: details.website ?? null,
        generatedSiteUrl: null,
        status: 'new',
        scannedAt: now,
        updatedAt: now,
      });

      totalFound++;
      if (!details.website) totalNoWebsite++;

      onProgress?.({
        category,
        city,
        found: totalFound,
        noWebsite: totalNoWebsite,
        processed: i + 1,
        total: places.length,
      });
    }

    await sleep(500);
  }

  return { found: totalFound, noWebsite: totalNoWebsite };
}
