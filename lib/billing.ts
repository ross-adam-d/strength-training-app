import Stripe from 'stripe'
import { getStripe, tierFromProductId, mapStripeStatus } from './stripe'
import { prisma } from './prisma'

/**
 * Immediately syncs a completed Stripe checkout session to the DB.
 * Called on the success redirect before the async webhook fires.
 * Non-fatal — if it fails, the webhook will catch up.
 */
export async function syncCheckoutSession(sessionId: string, expectedUserId: string): Promise<void> {
  try {
    const checkoutSession = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['subscription.items.data.price.product'],
    })

    const userId = checkoutSession.metadata?.userId
    if (!userId || userId !== expectedUserId) return
    if (!checkoutSession.subscription) return

    const sub = checkoutSession.subscription as Stripe.Subscription
    const price = sub.items.data[0]?.price
    const product = price?.product as Stripe.Product | undefined
    const tier = product ? tierFromProductId(product.id) : 'PREMIERE'
    const status = mapStripeStatus(sub.status)

    await prisma.subscription.update({
      where: { userId },
      data: {
        stripeSubscriptionId: sub.id,
        status,
        tier,
        trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : new Date(),
      },
    })
  } catch (err) {
    console.error('[billing] syncCheckoutSession error:', err)
    // Non-fatal — webhook will handle it
  }
}
