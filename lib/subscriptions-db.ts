import DatabaseConstructor from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export type SubscriptionStatus = 'trialing' | 'active' | 'cancelled' | 'past_due';

export type Subscription = {
  id?: number;
  placeId: string;
  businessName: string;
  slug: string;
  planId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSessionId: string | null;
  status: SubscriptionStatus;
  trialEndsAt: string;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
};

const DB_PATH = path.join(process.cwd(), 'data', 'subscriptions.sqlite');

function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new DatabaseConstructor(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placeId TEXT NOT NULL UNIQUE,
      businessName TEXT NOT NULL,
      slug TEXT NOT NULL,
      planId TEXT NOT NULL,
      stripeCustomerId TEXT,
      stripeSubscriptionId TEXT,
      stripeSessionId TEXT,
      status TEXT NOT NULL DEFAULT 'trialing',
      trialEndsAt TEXT NOT NULL,
      currentPeriodEnd TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sub_placeId ON subscriptions(placeId);
    CREATE INDEX IF NOT EXISTS idx_sub_session ON subscriptions(stripeSessionId);
    CREATE INDEX IF NOT EXISTS idx_sub_status ON subscriptions(status);
  `);
  return db;
}

const db = initDb();

export function createOrUpdateSubscription(sub: Omit<Subscription, 'id'>) {
  db.prepare(`
    INSERT INTO subscriptions (placeId, businessName, slug, planId, stripeCustomerId, stripeSubscriptionId, stripeSessionId, status, trialEndsAt, currentPeriodEnd, createdAt, updatedAt)
    VALUES (@placeId, @businessName, @slug, @planId, @stripeCustomerId, @stripeSubscriptionId, @stripeSessionId, @status, @trialEndsAt, @currentPeriodEnd, @createdAt, @updatedAt)
    ON CONFLICT(placeId) DO UPDATE SET
      planId=excluded.planId,
      stripeCustomerId=COALESCE(excluded.stripeCustomerId, stripeCustomerId),
      stripeSubscriptionId=COALESCE(excluded.stripeSubscriptionId, stripeSubscriptionId),
      stripeSessionId=COALESCE(excluded.stripeSessionId, stripeSessionId),
      status=excluded.status,
      currentPeriodEnd=COALESCE(excluded.currentPeriodEnd, currentPeriodEnd),
      updatedAt=excluded.updatedAt
  `).run(sub);
}

export function getSubscriptionBySession(sessionId: string): Subscription | null {
  return db.prepare('SELECT * FROM subscriptions WHERE stripeSessionId=?').get(sessionId) as Subscription | null;
}

export function getSubscriptionByPlaceId(placeId: string): Subscription | null {
  return db.prepare('SELECT * FROM subscriptions WHERE placeId=?').get(placeId) as Subscription | null;
}

export function getSubscriptionByStripeId(stripeSubId: string): Subscription | null {
  return db.prepare('SELECT * FROM subscriptions WHERE stripeSubscriptionId=?').get(stripeSubId) as Subscription | null;
}

export function updateSubscriptionStatus(
  stripeSubId: string,
  status: SubscriptionStatus,
  currentPeriodEnd?: string
) {
  db.prepare('UPDATE subscriptions SET status=?, currentPeriodEnd=COALESCE(?,currentPeriodEnd), updatedAt=? WHERE stripeSubscriptionId=?')
    .run(status, currentPeriodEnd ?? null, new Date().toISOString(), stripeSubId);
}

export function getAllSubscriptions(): Subscription[] {
  return db.prepare('SELECT * FROM subscriptions ORDER BY createdAt DESC').all() as Subscription[];
}

export function getSubscriptionStats() {
  return db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status='trialing' THEN 1 ELSE 0 END) as trialing,
      SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM subscriptions
  `).get() as { total: number; trialing: number; active: number; cancelled: number };
}
