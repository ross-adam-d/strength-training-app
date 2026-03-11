import { getUserSubscriptionStatus } from '@/lib/subscription'
import { STRIPE_PRICES } from '@/lib/stripe'
import { PlanSelectionUI } from '@/components/PlanSelectionUI'
import { DismissibleBanner } from '@/components/DismissibleBanner'

export async function SubscriptionBanner({
  userId,
  subscriptionStatus,
  trialEndsAt,
}: {
  userId: string
  subscriptionStatus?: string | null
  trialEndsAt?: string | null
}) {
  if (!userId) return null

  // Skip DB call for statuses that never show a banner
  if (subscriptionStatus === 'ACTIVE') return null
  if (
    subscriptionStatus === 'CANCELLED' ||
    subscriptionStatus === 'READ_ONLY' ||
    subscriptionStatus === 'PAST_DUE'
  ) return null

  // Skip DB call for trialing users with plenty of time left
  if (subscriptionStatus === 'TRIALING' && trialEndsAt) {
    const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysLeft > 7) return null
  }

  // DB query only for: trialing ≤7 days, manual override cases, or unknown status
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

  // Active subscription with no trial end — no banner
  if (status === 'ACTIVE' && daysUntilExpiry === null) {
    return null
  }

  // Manual admin override — no banner needed
  if (!isExpired && canWrite && status !== 'TRIALING') {
    return null
  }

  // 8+ days remaining — no banner
  if (daysUntilExpiry !== null && daysUntilExpiry > 7) {
    return null
  }

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0
  const isLastDay = daysUntilExpiry === 1

  if (isExpiringSoon) {
    return (
      <DismissibleBanner>
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container mx-auto px-4 py-4 pr-12">
            <PlanSelectionUI daysLeft={daysUntilExpiry!} priceIds={STRIPE_PRICES} />
          </div>
        </div>
      </DismissibleBanner>
    )
  }

  return null
}
