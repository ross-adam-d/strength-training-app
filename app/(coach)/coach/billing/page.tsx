import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BillingSuccessRefresher } from '@/components/BillingSuccessRefresher'
import { ManageCoachBillingButton, UpgradeToProButton, CoachSubscribeButton } from '@/components/CoachBillingActions'

function statusLabel(status: string) {
  switch (status) {
    case 'TRIALING':  return { text: 'Free trial', colour: 'bg-blue-100 text-blue-700' }
    case 'ACTIVE':    return { text: 'Active', colour: 'bg-green-100 text-green-700' }
    case 'PAST_DUE':  return { text: 'Payment past due', colour: 'bg-red-100 text-red-700' }
    case 'CANCELLED': return { text: 'Cancelled', colour: 'bg-gray-100 text-gray-600' }
    default:          return { text: status, colour: 'bg-gray-100 text-gray-600' }
  }
}

export default async function CoachBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; session_id?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const billingSuccess = params.billing === 'success'

  const coachSub = await prisma.coachSubscription.findUnique({
    where: { userId: session.user.id },
    select: {
      plan: true,
      status: true,
      trialEndsAt: true,
      cancelledAt: true,
      stripeSubscriptionId: true,
    },
  })

  const hasActiveSub = coachSub && ['TRIALING', 'ACTIVE', 'PAST_DUE'].includes(coachSub.status)
  const label = coachSub ? statusLabel(coachSub.status) : null

  return (
    <div className="max-w-2xl space-y-8">
      {billingSuccess && <BillingSuccessRefresher />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coach billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your coaching subscription</p>
      </div>

      {billingSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-800 font-medium">
          Subscription active — welcome to pbX coaching!
        </div>
      )}

      {/* Current plan */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Current plan</h2>

        {!coachSub ? (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">You don&apos;t have a coach subscription yet.</p>
            <div className="flex flex-wrap gap-3">
              <CoachSubscribeButton plan="STARTER" />
              <CoachSubscribeButton plan="PRO" />
            </div>
            <p className="text-xs text-gray-400">14-day free trial · no credit card required during trial</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg font-bold text-gray-900">
                    {coachSub.plan === 'PRO' ? 'Pro Coach' : 'Starter Coach'}
                  </span>
                  {label && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${label.colour}`}>
                      {label.text}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {coachSub.plan === 'PRO' ? 'Unlimited clients' : 'Up to 5 clients'}
                </p>
                {coachSub.status === 'TRIALING' && coachSub.trialEndsAt && (
                  <p className="text-sm text-blue-600 mt-1">
                    Trial ends {new Date(coachSub.trialEndsAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                {coachSub.status === 'CANCELLED' && coachSub.cancelledAt && (
                  <p className="text-sm text-gray-400 mt-1">
                    Cancelled on {new Date(coachSub.cancelledAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>

              {hasActiveSub && coachSub.stripeSubscriptionId && (
                <ManageCoachBillingButton />
              )}
            </div>

            {/* Upgrade prompt */}
            {coachSub.plan === 'STARTER' && hasActiveSub && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Upgrade to Pro Coach</p>
                    <p className="text-xs text-gray-500">Unlimited clients · $35 AUD/mo</p>
                  </div>
                  <UpgradeToProButton />
                </div>
              </div>
            )}

            {/* Resubscribe after cancellation */}
            {coachSub.status === 'CANCELLED' && (
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <p className="text-sm text-gray-600">Resubscribe to resume your coaching access:</p>
                <div className="flex flex-wrap gap-3">
                  <CoachSubscribeButton plan="STARTER" />
                  <CoachSubscribeButton plan="PRO" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plan comparison */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Plan details</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="font-semibold text-gray-900 mb-1">Starter Coach</div>
            <div className="text-gray-500 text-xs mb-3">$19 AUD/mo · up to 5 clients</div>
            <ul className="space-y-1 text-gray-600 text-xs">
              {['5 client seats', 'Build & assign training blocks', 'In-app messaging', 'Progress tracking', 'Clients get Elite access'].map(f => (
                <li key={f} className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="font-semibold text-white mb-1">Pro Coach</div>
            <div className="text-gray-400 text-xs mb-3">$35 AUD/mo · unlimited clients</div>
            <ul className="space-y-1 text-gray-300 text-xs">
              {['Unlimited client seats', 'Everything in Starter', 'Priority support'].map(f => (
                <li key={f} className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
