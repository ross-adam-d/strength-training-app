import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bodySchema = z.object({
  priceId: z.string().startsWith('price_'),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 })
  }

  const { priceId } = parsed.data
  const userId = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      subscription: { select: { stripeCustomerId: true, trialEndsAt: true } },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Create Stripe customer on first checkout and persist it immediately
  let stripeCustomerId = user.subscription?.stripeCustomerId
  if (!stripeCustomerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId },
    })
    stripeCustomerId = customer.id
    await prisma.subscription.update({
      where: { userId },
      data: { stripeCustomerId },
    })
  }

  const baseUrl = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').trim()

  // Determine trial eligibility:
  // - trialEndsAt not set → brand new user, grant 14-day trial
  // - trialEndsAt in the future → mid-trial, honour existing end date
  // - trialEndsAt in the past → already trialed, no trial on new subscription
  const trialEndsAt = user.subscription?.trialEndsAt
  const now = new Date()
  let trialData: { trial_period_days: number } | { trial_end: number } | Record<string, never>
  if (!trialEndsAt) {
    trialData = { trial_period_days: 14 }
  } else if (trialEndsAt > now) {
    trialData = { trial_end: Math.floor(trialEndsAt.getTime() / 1000) }
  } else {
    trialData = {}
  }

  let checkoutSession
  try {
    checkoutSession = await getStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_collection: 'always',
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        ...trialData,
        metadata: { userId },
      },
      success_url: `${baseUrl}/dashboard?billing=success&uid=${userId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard?billing=cancelled`,
      metadata: { userId },
    })
  } catch (err: any) {
    console.error('[checkout] Stripe error:', err?.message)
    return NextResponse.json({ error: err?.message ?? 'Stripe error' }, { status: 500 })
  }

  return NextResponse.json({ url: checkoutSession.url })
}
