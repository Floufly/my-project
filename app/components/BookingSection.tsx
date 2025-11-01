'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { DateTime } from 'luxon';
import { SERVICES } from '@/config/services';
import { DEFAULT_TIMEZONE } from '@/config/availability';
import type { PaymentMethod } from '@/lib/types';
import styles from './BookingSection.module.css';

interface AvailabilitySlot {
  startISO: string;
  endISO: string;
}

interface AvailabilityDay {
  date: string;
  weekdayLabel: string;
  slots: AvailabilitySlot[];
}

interface PaymentInfo {
  provider: string;
  url?: string;
  reference?: string;
  instructions?: string;
}

interface BookingResponse {
  booking: {
    id: number;
    startISO: string;
    endISO: string;
    serviceId: string;
    paymentMethod: PaymentMethod;
    paymentStatus: string;
  };
  message: string;
  payment?: PaymentInfo;
  calendar?: {
    provider: string;
    eventId: string;
  } | null;
  ics?: {
    filename: string;
    content: string;
  } | null;
}

type SubmissionState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: BookingResponse }
  | { status: 'error'; message: string };

const PAYMENT_METHODS: { id: PaymentMethod; label: string; description: string }[] = [
  {
    id: 'card',
    label: 'Carte bancaire',
    description: 'Paiement sécurisé en ligne via Stripe.'
  },
  {
    id: 'crypto',
    label: 'Cryptomonnaie',
    description: 'Règlement via Coinbase Commerce (BTC, ETH, USDT, ...).'
  },
  {
    id: 'telegram',
    label: 'Telegram',
    description: 'Paiement ou échange direct sur Telegram.'
  }
];

export function BookingSection() {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(SERVICES[0]?.id ?? '');
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [submission, setSubmission] = useState<SubmissionState>({ status: 'idle' });

  useEffect(() => {
    if (!selectedServiceId) return;

    const controller = new AbortController();
    setSubmission({ status: 'idle' });
    const fetchAvailability = async () => {
      setLoadingAvailability(true);
      setAvailabilityError(null);
      setSelectedSlot('');
      try {
        const response = await fetch(`/api/availability?serviceId=${selectedServiceId}`, {
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error('Impossible de récupérer les disponibilités.');
        }
        const data = (await response.json()) as { days: AvailabilityDay[] };
        setAvailability(data.days);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setAvailabilityError('Nous ne parvenons pas à charger les créneaux. Merci de réessayer.');
        }
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAvailability();
    return () => controller.abort();
  }, [selectedServiceId]);

  const selectedService = useMemo(
    () => SERVICES.find((service) => service.id === selectedServiceId),
    [selectedServiceId]
  );

  const icsDownloadUrl = useMemo(() => {
    if (submission.status !== 'success' || !submission.data.ics) {
      return null;
    }

    const blob = new Blob([submission.data.ics.content], {
      type: 'text/calendar;charset=utf-8'
    });
    return URL.createObjectURL(blob);
  }, [submission]);

  useEffect(() => {
    return () => {
      if (icsDownloadUrl) {
        URL.revokeObjectURL(icsDownloadUrl);
      }
    };
  }, [icsDownloadUrl]);

  const handleInput = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSlot) {
      setSubmission({ status: 'error', message: 'Merci de sélectionner un créneau horaire.' });
      return;
    }

    if (!selectedServiceId) {
      setSubmission({ status: 'error', message: 'Veuillez choisir un type de séance.' });
      return;
    }

    setSubmission({ status: 'loading' });

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          serviceId: selectedServiceId,
          slotStartISO: selectedSlot,
          paymentMethod
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Réservation impossible.' }));
        throw new Error(error.message ?? 'Réservation impossible.');
      }

      const data = (await response.json()) as BookingResponse;
      setSubmission({ status: 'success', data });
    } catch (error) {
      setSubmission({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Une erreur inattendue est survenue. Merci de réessayer ultérieurement.'
      });
    }
  };

  return (
    <section id="reservation" className={styles.section}>
      <div className="container">
        <div className={styles.intro}>
          <div>
            <h2 className="section-title">Réserver votre consultation</h2>
            <p className="section-subtitle">
              Choisissez le format qui vous correspond, sélectionnez un créneau disponible et finalisez votre réservation en
              toute autonomie.
            </p>
          </div>
          <div className={styles.highlight}>
            <strong>Automatisation complète</strong>
            <p>
              Chaque réservation bloque le créneau dans l’agenda connecté et vous recevez un récapitulatif complet par e-mail.
            </p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div>
              <label htmlFor="service">Format de séance</label>
              <select
                id="service"
                value={selectedServiceId}
                onChange={(event) => setSelectedServiceId(event.target.value)}
                required
              >
                {SERVICES.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.title} — {service.priceEUR} €
                  </option>
                ))}
              </select>
              {selectedService && (
                <p className={styles.serviceDetail}>
                  Durée : {selectedService.durationMinutes} min — {selectedService.description}
                </p>
              )}
            </div>

            <div className={styles.availability}>
              <h3>Choisissez un créneau</h3>
              {loadingAvailability && <p>Chargement des disponibilités…</p>}
              {availabilityError && <p className={styles.error}>{availabilityError}</p>}
              {!loadingAvailability && !availabilityError && availability.length === 0 && (
                <p>Aucun créneau n’est disponible pour le moment. Merci de revenir un peu plus tard.</p>
              )}

              <div className={styles.availabilityGrid}>
                {availability.map((day) => (
                  <article key={day.date} className={styles.availabilityCard}>
                    <h4>{day.weekdayLabel}</h4>
                    <div className={styles.slotList}>
                      {day.slots.map((slot) => {
                        const start = DateTime.fromISO(slot.startISO, { zone: 'utc' })
                          .setZone(DEFAULT_TIMEZONE)
                          .setLocale('fr');
                        return (
                          <button
                            key={slot.startISO}
                            type="button"
                            onClick={() => setSelectedSlot(slot.startISO)}
                            className={selectedSlot === slot.startISO ? styles.selectedSlot : ''}
                          >
                            {start.toFormat('HH:mm')} —{' '}
                            {start.plus({ minutes: selectedService?.durationMinutes ?? 0 }).toFormat('HH:mm')}
                          </button>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="name">Nom et prénom</label>
              <input id="name" type="text" required value={form.name} onChange={handleInput('name')} />
            </div>
            <div>
              <label htmlFor="email">Adresse e-mail</label>
              <input id="email" type="email" required value={form.email} onChange={handleInput('email')} />
            </div>
            <div>
              <label htmlFor="phone">Téléphone (optionnel)</label>
              <input id="phone" type="tel" value={form.phone} onChange={handleInput('phone')} />
            </div>
            <div className={styles.fullWidth}>
              <label htmlFor="notes">Contexte ou attentes particulières</label>
              <textarea
                id="notes"
                rows={4}
                placeholder="Précisez vos questions ou votre situation pour préparer la séance."
                value={form.notes}
                onChange={handleInput('notes')}
              />
            </div>

            <div className={styles.fullWidth}>
              <h3>Méthode de paiement</h3>
              <div className={styles.paymentGrid}>
                {PAYMENT_METHODS.map((method) => (
                  <label key={method.id} className={styles.paymentCard}>
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                    />
                    <div>
                      <strong>{method.label}</strong>
                      <p>{method.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button className="gradient-button" type="submit" disabled={submission.status === 'loading'}>
            {submission.status === 'loading' ? 'Validation en cours…' : 'Confirmer ma réservation'}
          </button>
        </form>

        {submission.status === 'error' && <p className={styles.error}>{submission.message}</p>}

        {submission.status === 'success' && (
          <div className={styles.confirmation}>
            <h3>Merci ! Votre créneau est réservé.</h3>
            <p>{submission.data.message}</p>
            {submission.data.payment && (
              <div className={styles.paymentInfo}>
                <h4>Étape paiement</h4>
                {submission.data.payment.url ? (
                  <a className="gradient-button" href={submission.data.payment.url} target="_blank" rel="noreferrer">
                    Finaliser le paiement ({submission.data.payment.provider})
                  </a>
                ) : (
                  <p>{submission.data.payment.instructions}</p>
                )}
                {submission.data.payment.reference && (
                  <p className={styles.reference}>Référence : {submission.data.payment.reference}</p>
                )}
                {submission.data.payment.instructions && submission.data.payment.url && (
                  <p className={styles.instructions}>{submission.data.payment.instructions}</p>
                )}
              </div>
            )}
            {submission.data.calendar && (
              <p>
                📅 L’événement a été ajouté automatiquement à l’agenda connecté ({submission.data.calendar.provider}).
              </p>
            )}
            {icsDownloadUrl && submission.data.ics && (
              <a className={styles.icsButton} href={icsDownloadUrl} download={submission.data.ics.filename}>
                Télécharger le fichier agenda (.ics)
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
