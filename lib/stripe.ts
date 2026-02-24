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
  CORE:  'prod_U2NH3sMFv9sdOn',  // PBX core  (Basic)
  ELITE: 'prod_U2NTjm8x7TMHTt',  // PBX elite (Premiere)
} as const

// Price IDs — loaded from env vars so sandbox/production stay separate
export const STRIPE_PRICES = {
  CORE_AUD_MONTHLY:  process.env.STRIPE_PRICE_CORE_AUD_MONTHLY!,
  CORE_AUD_ANNUAL:   process.env.STRIPE_PRICE_CORE_AUD_ANNUAL!,
  CORE_USD_MONTHLY:  process.env.STRIPE_PRICE_CORE_USD_MONTHLY!,
  CORE_USD_ANNUAL:   process.env.STRIPE_PRICE_CORE_USD_ANNUAL!,
  ELITE_AUD_MONTHLY: process.env.STRIPE_PRICE_ELITE_AUD_MONTHLY!,
  ELITE_AUD_ANNUAL:  process.env.STRIPE_PRICE_ELITE_AUD_ANNUAL!,
  ELITE_USD_MONTHLY: process.env.STRIPE_PRICE_ELITE_USD_MONTHLY!,
  ELITE_USD_ANNUAL:  process.env.STRIPE_PRICE_ELITE_USD_ANNUAL!,
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
