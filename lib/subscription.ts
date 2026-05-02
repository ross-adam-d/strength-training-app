import { prisma } from './prisma'

/**
 * Returns true if the user is a coached athlete without their own active subscription.
 * These users can log workouts and access coach-assigned blocks,
 * but cannot create their own training blocks/phases.
 */
export async function isCoachOnlyMode(userId: string): Promise<boolean> {
  const [sub, coachRel] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId },
      select: { status: true, trialEndsAt: true, manualAccessGrantedUntil: true },
    }),
    prisma.coachClientRelationship.findFirst({
      where: { clientId: userId, status: 'ACTIVE' },
      select: { id: true },
    }),
  ])

  if (!coachRel) return false // not a coached athlete

  const now = new Date()
  const hasOwnAccess =
    (sub?.manualAccessGrantedUntil && sub.manualAccessGrantedUntil > now) ||
    sub?.status === 'ACTIVE' ||
    (sub?.status === 'TRIALING' && sub.trialEndsAt != null && sub.trialEndsAt > now)

  return !hasOwnAccess
}

export type SubscriptionAccessStatus = {
  canWrite: boolean
  isExpired: boolean
  daysUntilExpiry: number | null
  status: string
}

export async function getUserSubscriptionStatus(userId: string): Promise<SubscriptionAccessStatus> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  if (!subscription) {
    return {
      canWrite: false,
      isExpired: true,
      daysUntilExpiry: null,
      status: 'NONE',
    }
  }

  const now = new Date()

  // Admin manual override: if manualAccessGrantedUntil is in the future, full access.
  // Return daysUntilExpiry: null so the subscription banner is never shown — the admin
  // explicitly granted access and the user should not see any expiry warnings.
  if (subscription.manualAccessGrantedUntil && subscription.manualAccessGrantedUntil > now) {
    return {
      canWrite: true,
      isExpired: false,
      daysUntilExpiry: null,
      status: subscription.status,
    }
  }

  // ACTIVE subscription
  if (subscription.status === 'ACTIVE') {
    return {
      canWrite: true,
      isExpired: false,
      daysUntilExpiry: null,
      status: 'ACTIVE',
    }
  }

  // TRIALING: check trial period
  if (subscription.status === 'TRIALING') {
    if (subscription.trialEndsAt > now) {
      const msUntil = subscription.trialEndsAt.getTime() - now.getTime()
      const daysUntilExpiry = Math.ceil(msUntil / (1000 * 60 * 60 * 24))
      return {
        canWrite: true,
        isExpired: false,
        daysUntilExpiry,
        status: 'TRIALING',
      }
    }
    // Trial ended — treat as READ_ONLY
    return {
      canWrite: false,
      isExpired: true,
      daysUntilExpiry: 0,
      status: 'TRIALING',
    }
  }

  // READ_ONLY or CANCELLED
  return {
    canWrite: false,
    isExpired: true,
    daysUntilExpiry: null,
    status: subscription.status,
  }
}
