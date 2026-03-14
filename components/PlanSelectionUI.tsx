'use client'

import { useState } from 'react'

type PriceMap = {
  CORE_AUD_MONTHLY: string
  CORE_AUD_ANNUAL: string
  CORE_USD_MONTHLY: string
  CORE_USD_ANNUAL: string
  ELITE_AUD_MONTHLY: string
  ELITE_AUD_ANNUAL: string
  ELITE_USD_MONTHLY: string
  ELITE_USD_ANNUAL: string
}

export function PlanSelectionUI({ daysLeft, priceIds }: { daysLeft?: number; priceIds: PriceMap }) {
  const [currency, setCurrency] = useState<'AUD' | 'USD'>('AUD')
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  async function checkout(priceId: string) {
    setLoading(priceId)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.assign(data.url)
      } else {
        setLoading(null)
      }
    } catch {
      setLoading(null)
    }
  }

  const prices = {
    monthly: currency === 'AUD'
      ? { id: priceIds.ELITE_AUD_MONTHLY, display: '$15' }
      : { id: priceIds.ELITE_USD_MONTHLY, display: '$10' },
    annual: currency === 'AUD'
      ? { id: priceIds.ELITE_AUD_ANNUAL,  display: '$150' }
      : { id: priceIds.ELITE_USD_ANNUAL,  display: '$100' },
  }

  const price  = prices[period]
  const suffix = period === 'monthly' ? '/mo' : '/yr'

  return (
    <div className="space-y-4">
      <p className="text-amber-800 text-sm font-medium">
        {daysLeft === undefined
          ? 'Choose a plan to continue with pbX.'
          : daysLeft === 1
            ? 'Last day of your free trial — subscribe to keep your access.'
            : `${daysLeft} days left in your free trial — subscribe to keep your access.`}
      </p>

      {/* Toggles */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-md border border-amber-300 overflow-hidden text-sm">
          {(['AUD', 'USD'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-3 py-1 font-medium transition ${
                currency === c
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-white text-amber-700 hover:bg-amber-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex rounded-md border border-amber-300 overflow-hidden text-sm">
          {(['monthly', 'annual'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 font-medium transition ${
                period === p
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-white text-amber-700 hover:bg-amber-50'
              }`}
            >
              {p === 'monthly' ? 'Monthly' : 'Annual — save 17%'}
            </button>
          ))}
        </div>
      </div>

      {/* Single plan card */}
      <div className="max-w-sm">
        <div className="bg-amber-600 border border-amber-700 rounded-lg p-4 text-white">
          <h3 className="font-semibold">pbX Elite</h3>
          <p className="text-xs text-amber-100 mt-0.5">Full access — everything included</p>
          <p className="mt-2 text-2xl font-bold">
            {price.display}
            <span className="text-sm font-normal text-amber-200"> {suffix} {currency}</span>
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-amber-100">
            {[
              'Training block planning — unlimited',
              'Workout logging & progressive overload',
              'Full history, all-time PRs & strength charts',
              'Deep analytics & readiness score',
              'Export your data any time',
            ].map((f) => (
              <li key={f} className="flex gap-1.5 items-start">
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => checkout(price.id)}
            disabled={loading !== null}
            className="mt-4 w-full py-2 text-sm font-medium bg-white hover:bg-amber-50 text-amber-700 rounded-md transition disabled:opacity-60"
          >
            {loading === price.id ? 'Loading…' : 'Subscribe'}
          </button>
        </div>
      </div>

      <p className="text-xs text-amber-700">
        Cancel anytime · Use code <span className="font-semibold">BETA30</span> at checkout for 30% off for 12 months
      </p>
    </div>
  )
}
