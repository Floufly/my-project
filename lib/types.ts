export type PaymentMethod = 'card' | 'crypto' | 'telegram';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface BookingRecord {
  id: number;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  serviceId: string;
  startISO: string;
  endISO: string;
  paymentMethod: PaymentMethod;
  paymentStatus: BookingStatus;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
}
