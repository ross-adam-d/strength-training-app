import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe, tierFromProductId, mapStripeStatus } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { SubscriptionStatus } from '@prisma/client'

export async function POST(request: Request) {
  const body = await request.arrayBuffer()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      Buffer.from(body),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription)
        break
      default:
        console.log(`[Webhook] Unhandled event: ${event.type}`)
    }
  } catch (err) {
    console.error(`[Webhook] Error handling ${event.type}:`, err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  if (!userId || !session.subscription) return

  const stripeSubscription = await getStripe().subscriptions.retrieve(
    session.subscription as string,
    { expand: ['items.data.price.product'] }
  )

  const price = stripeSubscription.items.data[0]?.price
  const product = price?.product as Stripe.Product | undefined
  const tier = product ? tierFromProductId(product.id) : 'PREMIERE'
  const status = mapStripeStatus(stripeSubscription.status)

  await prisma.subscription.update({
    where: { userId },
    data: {
      stripeSubscriptionId: stripeSubscription.id,
      status,
      tier,
      trialEndsAt: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : new Date(),
    },
  })

  console.log(`[Webhook] checkout.session.completed: userId=${userId}, tier=${tier}, status=${status}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) {
    const sub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    })
    if (!sub) {
      console.error(`[Webhook] subscription.updated: not found by ID: ${subscription.id}`)
      return
    }
    return updateSubscriptionInDb(sub.userId, subscription.id)
  }
  return updateSubscriptionInDb(userId, subscription.id)
}

async function updateSubscriptionInDb(userId: string, subscriptionId: string) {
  const stripeSubscription = await getStripe().subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product'],
  })

  const price = stripeSubscription.items.data[0]?.price
  const product = price?.product as Stripe.Product | undefined
  const tier = product ? tierFromProductId(product.id) : 'PREMIERE'
  const status = mapStripeStatus(stripeSubscription.status)

  const updateData: Parameters<typeof prisma.subscription.update>[0]['data'] = {
    status,
    tier,
  }

  if (stripeSubscription.trial_end) {
    updateData.trialEndsAt = new Date(stripeSubscription.trial_end * 1000)
  }

  if (status === SubscriptionStatus.CANCELLED) {
    updateData.cancelledAt = new Date()
  }

  await prisma.subscription.update({ where: { userId }, data: updateData })
  console.log(`[Webhook] subscription.updated: userId=${userId}, tier=${tier}, status=${status}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) {
    const sub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    })
    if (!sub) return
    return cancelSubscriptionInDb(sub.userId)
  }
  return cancelSubscriptionInDb(userId)
}

async function cancelSubscriptionInDb(userId: string) {
  await prisma.subscription.update({
    where: { userId },
    data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
  })
  console.log(`[Webhook] subscription.deleted: userId=${userId}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.parent?.subscription_details?.subscription
  if (!subscriptionId) return

  const subId = typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id
  const sub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subId },
  })
  if (!sub) return

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: SubscriptionStatus.ACTIVE },
  })
  console.log(`[Webhook] invoice.payment_succeeded: subscriptionId=${subId}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.parent?.subscription_details?.subscription
  if (!subscriptionId) return

  const subId = typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id
  const sub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subId },
  })
  if (!sub) return

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: SubscriptionStatus.PAST_DUE },
  })
  console.log(`[Webhook] invoice.payment_failed: subscriptionId=${subId}`)
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  // TODO: Send reminder email 3 days before trial ends
  const userId = subscription.metadata?.userId
  console.log(`[Webhook] trial_will_end: userId=${userId ?? 'unknown'}, subscriptionId=${subscription.id}`)
}
