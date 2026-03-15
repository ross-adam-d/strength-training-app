import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe, COACH_STRIPE_PRICES } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const VALID_COACH_PRICES = new Set(Object.values(COACH_STRIPE_PRICES))

const bodySchema = z.object({
  priceId: z.string().startsWith('price_'),
  plan: z.enum(['STARTER', 'PRO']),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { priceId, plan } = parsed.data

  if (!VALID_COACH_PRICES.has(priceId)) {
    return NextResponse.json({ error: 'Invalid coach price ID' }, { status: 400 })
  }

  const userId = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      coachSubscription: { select: { stripeCustomerId: true } },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Coach subscriptions use their own Stripe customer ID (separate from user subscription)
  let stripeCustomerId = user.coachSubscription?.stripeCustomerId
  if (!stripeCustomerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId, type: 'coach' },
    })
    stripeCustomerId = customer.id
  }

  const baseUrl = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').trim()

  let checkoutSession
  try {
    checkoutSession = await getStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_collection: 'always',
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId, coachPlan: plan },
      },
      success_url: `${baseUrl}/coach-subscribe?billing=success&uid=${userId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/coach-subscribe?cancelled=1`,
      metadata: { userId, coachPlan: plan },
    })
  } catch (err: any) {
    console.error('[coach-checkout] Stripe error:', err?.message)
    return NextResponse.json({ error: err?.message ?? 'Stripe error' }, { status: 500 })
  }

  return NextResponse.json({ url: checkoutSession.url })
}
