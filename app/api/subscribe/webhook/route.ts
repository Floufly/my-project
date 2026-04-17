import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  getSubscriptionBySession,
  getSubscriptionByStripeId,
  updateSubscriptionStatus,
  createOrUpdateSubscription,
} from '@/lib/subscriptions-db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const existing = getSubscriptionBySession(session.id);
      if (existing && session.subscription) {
        createOrUpdateSubscription({
          ...existing,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          status: 'trialing',
          updatedAt: new Date().toISOString(),
        });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
      const status = sub.status === 'active' ? 'active'
        : sub.status === 'trialing' ? 'trialing'
        : sub.status === 'past_due' ? 'past_due'
        : 'cancelled';
      updateSubscriptionStatus(sub.id, status, periodEnd);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      updateSubscriptionStatus(sub.id, 'cancelled');
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        const record = getSubscriptionByStripeId(invoice.subscription as string);
        if (record) updateSubscriptionStatus(invoice.subscription as string, 'past_due');
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
