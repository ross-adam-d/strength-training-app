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
      subscription: { select: { stripeCustomerId: true } },
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

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  const checkoutSession = await getStripe().checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    payment_method_collection: 'always',
    allow_promotion_codes: true,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId },
    },
    success_url: `${baseUrl}/dashboard?billing=success`,
    cancel_url: `${baseUrl}/dashboard?billing=cancelled`,
    metadata: { userId },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
