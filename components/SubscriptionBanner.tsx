import { getUserSubscriptionStatus } from '@/lib/subscription'

export async function SubscriptionBanner({ userId }: { userId: string }) {
  const { canWrite, isExpired, daysUntilExpiry, status } = await getUserSubscriptionStatus(userId)

  // Fully expired — banner shown on the /subscribe page itself, not here
  if (isExpired) {
    return null
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
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">
              {isLastDay ? 'Last day of your free trial.' : `${daysUntilExpiry} days left in your free trial.`}
            </span>{' '}
            Pricing plans coming soon — we&apos;ll be in touch before your trial ends.
          </p>
        </div>
      </div>
    )
  }

  return null
}
