import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

export const PRICING_TIERS = {
  basic: { priceId: process.env.STRIPE_BASIC_PRICE_ID!, queries: 10, price: 9.99 },
  pro: { priceId: process.env.STRIPE_PRO_AICE_ID!, queries: 100, price: 49.99 },
  enterprise: { priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!, queries: 1000, price: 199.99 }
};
