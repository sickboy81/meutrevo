import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { internalServerError } from '@/lib/api-auth';
import { claimOneTimeToken } from '@/lib/rate-limit';
import { getStripe } from '@/lib/stripe';
import Stripe from 'stripe';

async function ensureStripeColumns() {
  await db
    .execute('ALTER TABLE users ADD COLUMN stripe_customer_id TEXT')
    .catch(() => {});
  await db
    .execute('ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT')
    .catch(() => {});
  await db
    .execute('ALTER TABLE users ADD COLUMN stripe_subscription_status TEXT')
    .catch(() => {});
}

async function grantProAccess(params: {
  userId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  subscriptionStatus?: string | null;
  premiumUntil?: string | null;
}) {
  const {
    userId,
    customerId,
    subscriptionId,
    subscriptionStatus,
    premiumUntil,
  } = params;

  let resolvedUserId = userId ?? null;
  if (!resolvedUserId && customerId) {
    const lookup = await db.execute({
      sql: 'SELECT id FROM users WHERE stripe_customer_id = ? LIMIT 1',
      args: [customerId],
    });
    resolvedUserId = (lookup.rows[0]?.id as string | undefined) ?? null;
  }

  if (!resolvedUserId) return;

  const safePremiumUntil =
    premiumUntil ??
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const safeCustomerId = customerId ?? null;
  const safeSubscriptionId = subscriptionId ?? null;
  const safeSubscriptionStatus = subscriptionStatus ?? null;

  await db.execute(
    `
      UPDATE users
      SET role = 'pro',
          premium_until = ?,
          stripe_customer_id = COALESCE(?, stripe_customer_id),
          stripe_subscription_id = COALESCE(?, stripe_subscription_id),
          stripe_subscription_status = COALESCE(?, stripe_subscription_status)
      WHERE id = ?
    `,
    [
      safePremiumUntil,
      safeCustomerId,
      safeSubscriptionId,
      safeSubscriptionStatus,
      resolvedUserId,
    ]
  );
}

async function revokeProAccess(params: {
  customerId?: string | null;
  subscriptionId?: string | null;
  subscriptionStatus?: string | null;
}) {
  const { customerId, subscriptionId, subscriptionStatus } = params;
  if (!customerId && !subscriptionId) return;

  const safeSubscriptionStatus = subscriptionStatus ?? null;
  const safeCustomerId = customerId ?? null;
  const safeSubscriptionId = subscriptionId ?? null;

  await db.execute(
    `
      UPDATE users
      SET role = 'free',
          stripe_subscription_status = COALESCE(?, stripe_subscription_status),
          premium_until = CURRENT_TIMESTAMP
      WHERE stripe_customer_id = COALESCE(?, stripe_customer_id)
         OR stripe_subscription_id = COALESCE(?, stripe_subscription_id)
    `,
    [safeSubscriptionStatus, safeCustomerId, safeSubscriptionId]
  );
}

function getInvoicePeriodEnd(invoice: Stripe.Invoice): string | null {
  const linePeriodEnds = invoice.lines.data
    .map((line) => line.period?.end)
    .filter((value): value is number => typeof value === 'number');

  if (linePeriodEnds.length === 0) return null;
  return new Date(Math.max(...linePeriodEnds) * 1000).toISOString();
}

function getSubscriptionPeriodEnd(
  subscription: Stripe.Subscription
): string | null {
  const periodEnds = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === 'number');

  if (periodEnds.length === 0) return null;
  return new Date(Math.max(...periodEnds) * 1000).toISOString();
}

export async function POST(request: Request) {
  try {
    await ensureStripeColumns();

    const headerList = await headers();
    const signature = headerList.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook Stripe não configurado corretamente' },
        { status: 400 }
      );
    }

    const rawBody = await request.text();
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );

    const firstDelivery = await claimOneTimeToken(
      `webhook:stripe:${event.id}`,
      10 * 60_000
    );
    if (!firstDelivery) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await grantProAccess({
        userId: session.metadata?.userId ?? session.client_reference_id ?? null,
        customerId:
          typeof session.customer === 'string' ? session.customer : null,
        subscriptionId:
          typeof session.subscription === 'string'
            ? session.subscription
            : null,
        subscriptionStatus: 'active',
      });
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      await grantProAccess({
        customerId:
          typeof invoice.customer === 'string' ? invoice.customer : null,
        subscriptionStatus: 'active',
        premiumUntil: getInvoicePeriodEnd(invoice),
      });
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const premiumUntil = getSubscriptionPeriodEnd(subscription);

      if (
        ['active', 'trialing', 'past_due', 'unpaid'].includes(
          subscription.status
        )
      ) {
        await grantProAccess({
          customerId:
            typeof subscription.customer === 'string'
              ? subscription.customer
              : null,
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          premiumUntil,
        });
      } else {
        await revokeProAccess({
          customerId:
            typeof subscription.customer === 'string'
              ? subscription.customer
              : null,
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      await revokeProAccess({
        customerId:
          typeof subscription.customer === 'string'
            ? subscription.customer
            : null,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      });
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    return internalServerError('Stripe webhook processing error:', err);
  }
}
