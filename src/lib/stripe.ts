import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PRICE_MONTHLY_ID &&
    process.env.STRIPE_PRICE_YEARLY_ID
  );
}

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY não configurada');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

export function getStripePriceId(planType: 'monthly' | 'annual') {
  return planType === 'annual'
    ? process.env.STRIPE_PRICE_YEARLY_ID
    : process.env.STRIPE_PRICE_MONTHLY_ID;
}
