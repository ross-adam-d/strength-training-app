import { prisma } from './prisma'

const REFERRAL_DAYS = 30

function addDays(base: Date | null | undefined, days: number): Date {
  const from = base && base > new Date() ? base : new Date()
  const result = new Date(from)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Grants 30 extra days to both the new user and their referrer.
 * Extends manualAccessGrantedUntil from the later of (today, current value).
 */
export async function grantReferralReward(newUserId: string, referrerId: string) {
  const [newUserSub, referrerSub] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId: newUserId },
      select: { manualAccessGrantedUntil: true },
    }),
    prisma.subscription.findUnique({
      where: { userId: referrerId },
      select: { manualAccessGrantedUntil: true },
    }),
  ])

  const updates: Promise<unknown>[] = []

  if (newUserSub) {
    updates.push(
      prisma.subscription.update({
        where: { userId: newUserId },
        data: { manualAccessGrantedUntil: addDays(newUserSub.manualAccessGrantedUntil, REFERRAL_DAYS) },
      })
    )
  }

  if (referrerSub) {
    updates.push(
      prisma.subscription.update({
        where: { userId: referrerId },
        data: { manualAccessGrantedUntil: addDays(referrerSub.manualAccessGrantedUntil, REFERRAL_DAYS) },
      })
    )
  }

  await Promise.all(updates)
}
