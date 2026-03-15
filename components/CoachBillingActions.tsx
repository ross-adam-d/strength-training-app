'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { COACH_STRIPE_PRICES } from '@/lib/stripe'

type Plan = 'STARTER' | 'PRO'

export function ManageCoachBillingButton() {
  const [loading, setLoading] = useState(false)

  async function handleManage() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/coach-portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.assign(data.url)
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleManage}
      disabled={loading}
      className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition disabled:opacity-60"
    >
      {loading ? 'Loading...' : 'Manage billing'}
    </button>
  )
}

export function UpgradeToProButton() {
  const { update } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/coach-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: COACH_STRIPE_PRICES.PRO_AUD_MONTHLY,
          plan: 'PRO',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.assign(data.url)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="px-4 py-2 text-sm font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-60 text-white"
        style={{ backgroundColor: '#FF8000' }}
      >
        {loading ? 'Loading...' : 'Upgrade to Pro Coach'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

export function CoachSubscribeButton({ plan }: { plan: Plan }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe() {
    setLoading(true)
    setError(null)
    const priceId = plan === 'PRO'
      ? COACH_STRIPE_PRICES.PRO_AUD_MONTHLY
      : COACH_STRIPE_PRICES.STARTER_AUD_MONTHLY
    try {
      const res = await fetch('/api/billing/coach-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.assign(data.url)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="px-4 py-2 text-sm font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-60 text-white"
        style={{ backgroundColor: '#FF8000' }}
      >
        {loading ? 'Loading...' : `Subscribe to ${plan === 'PRO' ? 'Pro' : 'Starter'} Coach`}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
