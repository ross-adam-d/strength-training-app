import { prisma } from './prisma'

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

  // Admin manual override: if manualAccessGrantedUntil is in the future, full access
  if (subscription.manualAccessGrantedUntil && subscription.manualAccessGrantedUntil > now) {
    const msUntil = subscription.manualAccessGrantedUntil.getTime() - now.getTime()
    const daysUntilExpiry = Math.ceil(msUntil / (1000 * 60 * 60 * 24))
    return {
      canWrite: true,
      isExpired: false,
      daysUntilExpiry,
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
