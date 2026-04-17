import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPlanById, PLANS } from '@/lib/subscription-plans';
import { createOrUpdateSubscription, getAllSubscriptions, getSubscriptionStats } from '@/lib/subscriptions-db';
import { getSiteBySlug } from '@/lib/sites-db';
import { updateBusinessStatus } from '@/lib/scanner-db';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY manquante');
  return new Stripe(key, { apiVersion: '2023-10-16' });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'stats') {
    return NextResponse.json(getSubscriptionStats());
  }
  return NextResponse.json(getAllSubscriptions());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slug, planId } = body as { slug: string; planId: string };

  if (!slug || !planId) {
    return NextResponse.json({ error: 'slug et planId requis' }, { status: 400 });
  }

  const site = getSiteBySlug(slug);
  if (!site) {
    return NextResponse.json({ error: 'Site non trouvé' }, { status: 404 });
  }

  const plan = getPlanById(planId);
  if (!plan) {
    return NextResponse.json({ error: 'Plan invalide. Valeurs: ' + PLANS.map((p) => p.id).join(', ') }, { status: 400 });
  }

  const baseUrl = process.env.SITE_BASE_URL ?? 'http://localhost:3000';

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY manquante dans .env' }, { status: 500 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    success_url: `${baseUrl}/sites/${slug}?subscribed=1`,
    cancel_url: `${baseUrl}/sites/${slug}?cancelled=1`,
    metadata: { slug, planId, placeId: site.placeId },
    subscription_data: {
      trial_period_days: 30,
      metadata: { slug, planId, placeId: site.placeId },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          recurring: { interval: 'month' },
          unit_amount: plan.priceEur * 100,
          product_data: {
            name: `Site web ${plan.name} — ${site.businessName}`,
            description: plan.description,
          },
        },
      },
    ],
  });

  // Record trial start immediately
  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  createOrUpdateSubscription({
    placeId: site.placeId,
    businessName: site.businessName,
    slug,
    planId,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripeSessionId: session.id,
    status: 'trialing',
    trialEndsAt,
    currentPeriodEnd: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  updateBusinessStatus(site.placeId, 'converted');

  return NextResponse.json({ url: session.url });
}
