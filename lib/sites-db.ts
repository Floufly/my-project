import DatabaseConstructor from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export type GeneratedSite = {
  id?: number;
  slug: string;
  placeId: string;
  businessName: string;
  category: string;
  city: string;
  address: string;
  phone: string | null;
  tagline: string;
  services: string[]; // stored as JSON
  primaryColor: string;
  secondaryColor: string;
  template: 'food' | 'beauty' | 'health' | 'services' | 'retail';
  rating: number | null;
  reviewCount: number | null;
  createdAt: string;
};

const DB_PATH = path.join(process.cwd(), 'data', 'sites.sqlite');

function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new DatabaseConstructor(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      placeId TEXT NOT NULL UNIQUE,
      businessName TEXT NOT NULL,
      category TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT,
      tagline TEXT NOT NULL,
      services TEXT NOT NULL,
      primaryColor TEXT NOT NULL,
      secondaryColor TEXT NOT NULL,
      template TEXT NOT NULL,
      rating REAL,
      reviewCount INTEGER,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sites_slug ON sites(slug);
    CREATE INDEX IF NOT EXISTS idx_sites_placeId ON sites(placeId);
  `);
  return db;
}

const db = initDb();

export function createSite(site: Omit<GeneratedSite, 'id'>) {
  db.prepare(`
    INSERT INTO sites (slug, placeId, businessName, category, city, address, phone, tagline, services, primaryColor, secondaryColor, template, rating, reviewCount, createdAt)
    VALUES (@slug, @placeId, @businessName, @category, @city, @address, @phone, @tagline, @services, @primaryColor, @secondaryColor, @template, @rating, @reviewCount, @createdAt)
    ON CONFLICT(placeId) DO UPDATE SET
      tagline=excluded.tagline, services=excluded.services,
      primaryColor=excluded.primaryColor, secondaryColor=excluded.secondaryColor,
      template=excluded.template
  `).run({ ...site, services: JSON.stringify(site.services) });
}

export function getSiteBySlug(slug: string): GeneratedSite | null {
  const row = db.prepare('SELECT * FROM sites WHERE slug=?').get(slug) as Record<string, unknown> | undefined;
  return row ? toRecord(row) : null;
}

export function getSiteByPlaceId(placeId: string): GeneratedSite | null {
  const row = db.prepare('SELECT * FROM sites WHERE placeId=?').get(placeId) as Record<string, unknown> | undefined;
  return row ? toRecord(row) : null;
}

export function getAllSites(limit = 100): GeneratedSite[] {
  const rows = db.prepare('SELECT * FROM sites ORDER BY createdAt DESC LIMIT ?').all(limit) as Record<string, unknown>[];
  return rows.map(toRecord);
}

function toRecord(row: Record<string, unknown>): GeneratedSite {
  return { ...row, services: JSON.parse(row.services as string) } as GeneratedSite;
}
