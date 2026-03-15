import Stripe from 'stripe'
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    })
  }
  return _stripe
}

// Product IDs (public identifiers — not secret)
export const STRIPE_PRODUCTS = {
  CORE:  'prod_U5W29cC5tl8XF9',  // PBX core  (Basic)  — live
  ELITE: 'prod_U5W2Wfy0lV24sb',  // PBX elite (Premiere) — live
} as const

// Price IDs — loaded from env vars so sandbox/production stay separate
// Env var names match stripe-copy-to-live.ts script output (PERIOD_CURRENCY order)
export const STRIPE_PRICES = {
  CORE_AUD_MONTHLY:  process.env.STRIPE_PRICE_CORE_MONTHLY_AUD!,
  CORE_AUD_ANNUAL:   process.env.STRIPE_PRICE_CORE_ANNUAL_AUD!,
  CORE_USD_MONTHLY:  process.env.STRIPE_PRICE_CORE_MONTHLY_USD!,
  CORE_USD_ANNUAL:   process.env.STRIPE_PRICE_CORE_ANNUAL_USD!,
  ELITE_AUD_MONTHLY: process.env.STRIPE_PRICE_ELITE_MONTHLY_AUD!,
  ELITE_AUD_ANNUAL:  process.env.STRIPE_PRICE_ELITE_ANNUAL_AUD!,
  ELITE_USD_MONTHLY: process.env.STRIPE_PRICE_ELITE_MONTHLY_USD!,
  ELITE_USD_ANNUAL:  process.env.STRIPE_PRICE_ELITE_ANNUAL_USD!,
} as const

export const COACH_STRIPE_PRICES = {
  STARTER_AUD_MONTHLY: process.env.STRIPE_PRICE_COACH_STARTER_MONTHLY_AUD!,
  STARTER_AUD_ANNUAL:  process.env.STRIPE_PRICE_COACH_STARTER_ANNUAL_AUD!,
  STARTER_USD_MONTHLY: process.env.STRIPE_PRICE_COACH_STARTER_MONTHLY_USD!,
  STARTER_USD_ANNUAL:  process.env.STRIPE_PRICE_COACH_STARTER_ANNUAL_USD!,
  PRO_AUD_MONTHLY:     process.env.STRIPE_PRICE_COACH_PRO_MONTHLY_AUD!,
  PRO_AUD_ANNUAL:      process.env.STRIPE_PRICE_COACH_PRO_ANNUAL_AUD!,
  PRO_USD_MONTHLY:     process.env.STRIPE_PRICE_COACH_PRO_MONTHLY_USD!,
  PRO_USD_ANNUAL:      process.env.STRIPE_PRICE_COACH_PRO_ANNUAL_USD!,
} as const

export function tierFromProductId(productId: string): SubscriptionTier {
  return productId === STRIPE_PRODUCTS.CORE ? SubscriptionTier.BASIC : SubscriptionTier.PREMIERE
}

export function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case 'trialing':  return SubscriptionStatus.TRIALING
    case 'active':    return SubscriptionStatus.ACTIVE
    case 'past_due':  return SubscriptionStatus.PAST_DUE
    case 'canceled':  return SubscriptionStatus.CANCELLED
    case 'unpaid':    return SubscriptionStatus.PAST_DUE
    case 'paused':    return SubscriptionStatus.READ_ONLY
    default:          return SubscriptionStatus.READ_ONLY
  }
}
