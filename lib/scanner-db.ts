import DatabaseConstructor from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export type ScannedBusiness = {
  id?: number;
  placeId: string;
  name: string;
  address: string;
  phone: string | null;
  category: string;
  city: string;
  rating: number | null;
  reviewCount: number | null;
  hasWebsite: boolean;
  websiteUrl: string | null;
  generatedSiteUrl: string | null;
  status: 'new' | 'site_generated' | 'contacted' | 'converted' | 'rejected';
  scannedAt: string;
  updatedAt: string;
};

const DB_PATH = path.join(process.cwd(), 'data', 'scanner.sqlite');

function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new DatabaseConstructor(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placeId TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT,
      category TEXT NOT NULL,
      city TEXT NOT NULL,
      rating REAL,
      reviewCount INTEGER,
      hasWebsite INTEGER NOT NULL DEFAULT 0,
      websiteUrl TEXT,
      generatedSiteUrl TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      scannedAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
    CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
    CREATE INDEX IF NOT EXISTS idx_businesses_hasWebsite ON businesses(hasWebsite);
  `);
  return db;
}

const db = initDb();

export function upsertBusiness(b: Omit<ScannedBusiness, 'id'>) {
  db.prepare(`
    INSERT INTO businesses (placeId, name, address, phone, category, city, rating, reviewCount, hasWebsite, websiteUrl, generatedSiteUrl, status, scannedAt, updatedAt)
    VALUES (@placeId, @name, @address, @phone, @category, @city, @rating, @reviewCount, @hasWebsite, @websiteUrl, @generatedSiteUrl, @status, @scannedAt, @updatedAt)
    ON CONFLICT(placeId) DO UPDATE SET
      name=excluded.name, address=excluded.address, phone=excluded.phone,
      rating=excluded.rating, reviewCount=excluded.reviewCount,
      hasWebsite=excluded.hasWebsite, websiteUrl=excluded.websiteUrl,
      updatedAt=excluded.updatedAt
  `).run({ ...b, hasWebsite: b.hasWebsite ? 1 : 0 });
}

export function getBusinessesWithoutSite(city?: string, limit = 50): ScannedBusiness[] {
  const rows = city
    ? db.prepare('SELECT * FROM businesses WHERE hasWebsite=0 AND city=? ORDER BY rating DESC LIMIT ?').all(city, limit)
    : db.prepare('SELECT * FROM businesses WHERE hasWebsite=0 ORDER BY rating DESC LIMIT ?').all(limit);
  return rows.map(toRecord);
}

export function getAllBusinesses(city?: string, limit = 100): ScannedBusiness[] {
  const rows = city
    ? db.prepare('SELECT * FROM businesses WHERE city=? ORDER BY scannedAt DESC LIMIT ?').all(city, limit)
    : db.prepare('SELECT * FROM businesses ORDER BY scannedAt DESC LIMIT ?').all(limit);
  return rows.map(toRecord);
}

export function updateBusinessStatus(placeId: string, status: ScannedBusiness['status'], generatedSiteUrl?: string) {
  db.prepare('UPDATE businesses SET status=?, generatedSiteUrl=?, updatedAt=? WHERE placeId=?')
    .run(status, generatedSiteUrl ?? null, new Date().toISOString(), placeId);
}

export function getScanStats() {
  return db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN hasWebsite=0 THEN 1 ELSE 0 END) as noWebsite,
      SUM(CASE WHEN status='site_generated' THEN 1 ELSE 0 END) as generated,
      SUM(CASE WHEN status='contacted' THEN 1 ELSE 0 END) as contacted,
      SUM(CASE WHEN status='converted' THEN 1 ELSE 0 END) as converted
    FROM businesses
  `).get() as { total: number; noWebsite: number; generated: number; contacted: number; converted: number };
}

function toRecord(row: Record<string, unknown>): ScannedBusiness {
  return { ...row, hasWebsite: row.hasWebsite === 1 } as ScannedBusiness;
}
