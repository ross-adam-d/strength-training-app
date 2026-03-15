import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const coachSub = await prisma.coachSubscription.findUnique({
    where: { userId: session.user.id },
    select: { stripeCustomerId: true },
  })

  if (!coachSub?.stripeCustomerId) {
    return NextResponse.json({ error: 'No coach billing account found' }, { status: 404 })
  }

  const baseUrl = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').trim()

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: coachSub.stripeCustomerId,
    return_url: `${baseUrl}/coach/billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
