import Stripe from 'stripe';
import Commerce from '@coinbase/commerce-node';
import type { BookingRecord } from './types';
import { SERVICES } from '@/config/services';

type PaymentProvider = 'stripe' | 'coinbase' | 'telegram' | 'manual';

export type PaymentInitResult = {
  provider: PaymentProvider;
  url?: string;
  reference?: string;
  instructions?: string;
};

function getServiceName(serviceId: string) {
  const service = SERVICES.find((svc) => svc.id === serviceId);
  return service ? service.title : 'Consultation de numérologie';
}

export async function initiatePayment(options: {
  booking: BookingRecord;
  successUrl: string;
  cancelUrl: string;
}): Promise<PaymentInitResult> {
  const { booking, successUrl, cancelUrl } = options;
  if (booking.paymentMethod === 'card') {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return {
        provider: 'manual',
        instructions:
          'Le paiement par carte est temporairement indisponible. Nous vous contacterons rapidement pour finaliser la transaction.'
      };
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: '2023-10-16'
    });

    const service = SERVICES.find((svc) => svc.id === booking.serviceId);
    const amount = (service?.priceEUR ?? 0) * 100;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${successUrl}?booking=${booking.id}&status=success`,
      cancel_url: `${cancelUrl}?booking=${booking.id}&status=cancelled`,
      payment_method_types: ['card'],
      customer_email: booking.email,
      metadata: {
        bookingId: String(booking.id),
        serviceId: booking.serviceId
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(amount),
            product_data: {
              name: `Consultation numérologie — ${getServiceName(booking.serviceId)}`
            }
          }
        }
      ]
    });

    return {
      provider: 'stripe',
      url: session.url ?? undefined,
      reference: session.id
    };
  }

  if (booking.paymentMethod === 'crypto') {
    const apiKey = process.env.COINBASE_COMMERCE_API_KEY;
    if (!apiKey) {
      return {
        provider: 'manual',
        instructions:
          'Le paiement en cryptomonnaie nécessite une intervention manuelle. Nous reviendrons vers vous avec une adresse de portefeuille sécurisée.'
      };
    }

    Commerce.Client.init(apiKey);
    const charge = await Commerce.resources.Charge.create({
      name: `Consultation numérologie — ${getServiceName(booking.serviceId)}`,
      description: 'Réglez votre séance en cryptomonnaie via Coinbase Commerce.',
      pricing_type: 'fixed_price',
      local_price: {
        amount: SERVICES.find((svc) => svc.id === booking.serviceId)?.priceEUR.toFixed(2) ?? '0.00',
        currency: 'EUR'
      },
      metadata: {
        bookingId: booking.id.toString()
      }
    });

    return {
      provider: 'coinbase',
      url: charge.hosted_url,
      reference: charge.code
    };
  }

  if (booking.paymentMethod === 'telegram') {
    const paymentUrl = process.env.TELEGRAM_PAYMENT_URL;
    const username = process.env.TELEGRAM_USERNAME;

    if (paymentUrl) {
      return {
        provider: 'telegram',
        url: paymentUrl,
        instructions: 'Vous serez redirigé vers Telegram pour finaliser le paiement ou échanger directement.'
      };
    }

    if (username) {
      return {
        provider: 'telegram',
        url: `https://t.me/${username.replace(/^@/, '')}`,
        instructions: 'Discutez sur Telegram pour finaliser le paiement et recevoir le lien de consultation.'
      };
    }

    return {
      provider: 'manual',
      instructions:
        'Nous vous contacterons sur Telegram pour finaliser le paiement dès que possible. Merci de votre confiance !'
    };
  }

  return {
    provider: 'manual',
    instructions: 'Nous vous recontacterons pour compléter le paiement.'
  };
}
