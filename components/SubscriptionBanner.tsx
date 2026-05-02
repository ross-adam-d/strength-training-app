import { getUserSubscriptionStatus } from '@/lib/subscription'
import { STRIPE_PRICES } from '@/lib/stripe'
import { PlanSelectionUI } from '@/components/PlanSelectionUI'
import { DismissibleBanner } from '@/components/DismissibleBanner'

export async function SubscriptionBanner({
  userId,
  role,
  subscriptionStatus,
  trialEndsAt,
  manualAccessGrantedUntil,
  hasActiveCoach,
}: {
  userId: string
  role?: string | null
  subscriptionStatus?: string | null
  trialEndsAt?: string | null
  manualAccessGrantedUntil?: string | null
  hasActiveCoach?: boolean
}) {
  if (!userId) return null

  // Admins and coaches have a different access model — never show user subscription banners
  if (role === 'ADMIN' || role === 'COACH') return null

  // Coached athletes have a different access model — never show subscription banners
  if (hasActiveCoach) return null

  // Skip DB call for statuses that never show a banner
  if (subscriptionStatus === 'ACTIVE') return null
  if (
    subscriptionStatus === 'CANCELLED' ||
    subscriptionStatus === 'READ_ONLY' ||
    subscriptionStatus === 'PAST_DUE'
  ) return null

  // If admin has explicitly granted access, never show a banner (session-level check)
  if (manualAccessGrantedUntil && new Date(manualAccessGrantedUntil) > new Date()) return null

  // Skip DB call for trialing users with plenty of time left
  if (subscriptionStatus === 'TRIALING' && trialEndsAt) {
    const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysLeft > 7) return null
  }

  // DB query for: trialing ≤7 days, manual override cases, or unknown status
  const { canWrite, isExpired, daysUntilExpiry, status } = await getUserSubscriptionStatus(userId)

  // Fully expired — show plan selection inline on dashboard
  if (isExpired) {
    return (
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="container mx-auto px-4 py-4">
          <PlanSelectionUI priceIds={STRIPE_PRICES} />
        </div>
      </div>
    )
  }

  // Valid access (any source) with no expiry window → no banner
  if (canWrite && daysUntilExpiry === null) {
    return null
  }

  // 8+ days remaining — no banner
  if (daysUntilExpiry !== null && daysUntilExpiry > 7) {
    return null
  }

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0

  if (isExpiringSoon) {
    return (
      <DismissibleBanner>
        <PlanSelectionUI daysLeft={daysUntilExpiry!} priceIds={STRIPE_PRICES} />
      </DismissibleBanner>
    )
  }

  return null
}
