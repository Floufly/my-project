import DatabaseConstructor from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type { BookingRecord, PaymentMethod, BookingStatus } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'appointments.sqlite');

function initDatabase() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseConstructor(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      notes TEXT,
      serviceId TEXT NOT NULL,
      startISO TEXT NOT NULL,
      endISO TEXT NOT NULL,
      paymentMethod TEXT NOT NULL,
      paymentStatus TEXT NOT NULL,
      paymentReference TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(serviceId, startISO)
    );
  `);

  db.exec(
    'CREATE INDEX IF NOT EXISTS idx_bookings_start ON bookings(startISO);'
  );

  return db;
}

declare global {
  // eslint-disable-next-line no-var
  var __db__: ReturnType<typeof initDatabase> | undefined;
}

function getDb() {
  if (!global.__db__) {
    global.__db__ = initDatabase();
  }
  return global.__db__;
}

export function getBookingsBetween(startISO: string, endISO: string): BookingRecord[] {
  const db = getDb();
  const stmt = db.prepare(
    'SELECT * FROM bookings WHERE startISO >= ? AND startISO < ? ORDER BY startISO ASC'
  );
  return stmt.all(startISO, endISO) as BookingRecord[];
}

export function createBooking(params: {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  serviceId: string;
  startISO: string;
  endISO: string;
  paymentMethod: PaymentMethod;
  paymentStatus?: BookingStatus;
  paymentReference?: string;
}): BookingRecord {
  const db = getDb();
  const nowISO = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO bookings
      (name, email, phone, notes, serviceId, startISO, endISO, paymentMethod, paymentStatus, paymentReference, createdAt, updatedAt)
    VALUES
      (@name, @email, @phone, @notes, @serviceId, @startISO, @endISO, @paymentMethod, @paymentStatus, @paymentReference, @createdAt, @updatedAt)
  `);

  const info = stmt.run({
    name: params.name,
    email: params.email,
    phone: params.phone ?? null,
    notes: params.notes ?? null,
    serviceId: params.serviceId,
    startISO: params.startISO,
    endISO: params.endISO,
    paymentMethod: params.paymentMethod,
    paymentStatus: params.paymentStatus ?? 'pending',
    paymentReference: params.paymentReference ?? null,
    createdAt: nowISO,
    updatedAt: nowISO
  });

  const booking = db
    .prepare('SELECT * FROM bookings WHERE id = ?')
    .get(info.lastInsertRowid) as BookingRecord;

  return booking;
}

export function updateBookingPayment(
  bookingId: number,
  paymentStatus: BookingStatus,
  paymentReference?: string
) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE bookings
    SET paymentStatus = ?, paymentReference = ?, updatedAt = ?
    WHERE id = ?
  `);
  stmt.run(paymentStatus, paymentReference ?? null, new Date().toISOString(), bookingId);
}

export function getBookingById(id: number): BookingRecord | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
  const booking = stmt.get(id);
  return booking as BookingRecord | undefined;
}
