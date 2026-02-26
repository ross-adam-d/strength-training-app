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

export function PlanSelectionUI({ daysLeft, priceIds }: { daysLeft: number; priceIds: PriceMap }) {
  const [currency, setCurrency] = useState<'AUD' | 'USD'>('AUD')
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState<string | null>(null) // priceId currently loading

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
    core: {
      monthly: currency === 'AUD'
        ? { id: priceIds.CORE_AUD_MONTHLY,  display: '$9' }
        : { id: priceIds.CORE_USD_MONTHLY,  display: '$7' },
      annual: currency === 'AUD'
        ? { id: priceIds.CORE_AUD_ANNUAL,   display: '$90' }
        : { id: priceIds.CORE_USD_ANNUAL,   display: '$70' },
    },
    elite: {
      monthly: currency === 'AUD'
        ? { id: priceIds.ELITE_AUD_MONTHLY, display: '$16' }
        : { id: priceIds.ELITE_USD_MONTHLY, display: '$12' },
      annual: currency === 'AUD'
        ? { id: priceIds.ELITE_AUD_ANNUAL,  display: '$160' }
        : { id: priceIds.ELITE_USD_ANNUAL,  display: '$120' },
    },
  }

  const corePrice  = prices.core[period]
  const elitePrice = prices.elite[period]
  const suffix     = period === 'monthly' ? '/mo' : '/yr'

  return (
    <div className="space-y-4">
      <p className="text-amber-800 text-sm font-medium">
        {daysLeft === 1
          ? 'Last day of your free trial'
          : `${daysLeft} days left in your free trial`}{' '}
        — choose a plan to keep your access.
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

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
        {/* Core */}
        <div className="bg-white border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900">Core</h3>
          <p className="text-xs text-gray-500 mt-0.5">Intelligent periodisation, all exercises</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {corePrice.display}
            <span className="text-sm font-normal text-gray-500"> {suffix} {currency}</span>
          </p>
          <button
            onClick={() => checkout(corePrice.id)}
            disabled={loading !== null}
            className="mt-3 w-full py-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-md transition disabled:opacity-60"
          >
            {loading === corePrice.id ? 'Loading…' : 'Subscribe'}
          </button>
        </div>

        {/* Premiere */}
        <div className="bg-amber-600 border border-amber-700 rounded-lg p-4 text-white">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">Premiere</h3>
            <span className="text-xs bg-white text-amber-700 font-semibold rounded-full px-2 py-0.5 whitespace-nowrap">
              Best value
            </span>
          </div>
          <p className="text-xs text-amber-100 mt-0.5">Everything in Core + Deep Analytics</p>
          <p className="mt-2 text-2xl font-bold">
            {elitePrice.display}
            <span className="text-sm font-normal text-amber-200"> {suffix} {currency}</span>
          </p>
          <button
            onClick={() => checkout(elitePrice.id)}
            disabled={loading !== null}
            className="mt-3 w-full py-2 text-sm font-medium bg-white hover:bg-amber-50 text-amber-700 rounded-md transition disabled:opacity-60"
          >
            {loading === elitePrice.id ? 'Loading…' : 'Subscribe'}
          </button>
        </div>
      </div>

      <p className="text-xs text-amber-700">
        Cancel anytime · Use code <span className="font-semibold">BETA30</span> at checkout for 30% off for 12 months
      </p>
    </div>
  )
}
