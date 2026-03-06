import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { STRIPE_PRICES } from '@/lib/stripe'
import { PlanSelectionUI } from '@/components/PlanSelectionUI'

export default async function SubscribePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  // Active users don't need to be here; trialing users only if trial hasn't expired
  const status = session.user.subscriptionStatus
  const trialEndsAt = session.user.trialEndsAt
  if (status === 'ACTIVE') redirect('/dashboard')
  if (status === 'TRIALING' && trialEndsAt && new Date(trialEndsAt) > new Date()) redirect('/dashboard')

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Your access has ended</h1>
        <p className="text-gray-500 mt-1">Subscribe to pick up where you left off — your training data is safe.</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <PlanSelectionUI priceIds={STRIPE_PRICES} />
      </div>
    </div>
  )
}
