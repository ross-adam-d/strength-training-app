'use client'

import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { PBeXLogo } from '@/components/PBeXLogo'
type Plan = 'STARTER' | 'PRO'
type Period = 'monthly' | 'annual'
type Currency = 'AUD' | 'USD'

const PLAN_INFO = {
  STARTER: {
    name: 'Starter Coach',
    tagline: 'Up to 5 clients',
    priceAUD: { monthly: 19, annual: 190 },
    priceUSD: { monthly: 13, annual: 130 },
    features: [
      'Up to 5 clients',
      'Build and assign training blocks',
      'In-app messaging',
      'Progress and compliance tracking',
      'Clients get full Elite access',
      'Coach profile page',
    ],
  },
  PRO: {
    name: 'Pro Coach',
    tagline: 'Unlimited clients',
    priceAUD: { monthly: 35, annual: 350 },
    priceUSD: { monthly: 24, annual: 240 },
    features: [
      'Unlimited clients',
      'Everything in Starter Coach',
      'Priority support',
    ],
  },
} as const

function Check() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#FF8000' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CoachSubscribeInner() {
  const { data: session, status, update } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()

  const planParam = searchParams.get('plan')?.toUpperCase()
  const cancelled = searchParams.get('cancelled') === '1'
  const billingSuccess = searchParams.get('billing') === 'success'

  // All hooks must be declared before any conditional returns
  const [selectedPlan, setSelectedPlan] = useState<Plan>(planParam === 'PRO' ? 'PRO' : 'STARTER')
  const [currency, setCurrency] = useState<Currency>('AUD')
  const [period, setPeriod] = useState<Period>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // After successful checkout: refresh JWT then redirect to coach billing page
  useEffect(() => {
    if (!billingSuccess) return
    update().then(() => {
      router.replace('/coach/billing?billing=success')
    })
  }, [billingSuccess]) // eslint-disable-line react-hooks/exhaustive-deps

  if (billingSuccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold">Activating your coach account...</p>
          <p className="text-gray-400 text-sm mt-1">Hang tight, this takes just a moment</p>
        </div>
      </div>
    )
  }

  async function handleCheckout() {
    if (!session?.user?.id) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/coach-subscribe?plan=${selectedPlan.toLowerCase()}`)}`)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/coach-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, currency, period }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      window.location.assign(data.url)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const info = PLAN_INFO[selectedPlan]
  const price = currency === 'AUD' ? info.priceAUD : info.priceUSD
  const displayPrice = period === 'monthly' ? price.monthly : Math.round(price.annual / 12)
  const annualSaving = Math.round((price.monthly * 12 - price.annual) / (price.monthly * 12) * 100)

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/"><PBeXLogo className="h-8 w-auto" color="#FF8000" /></Link>
          {!session && (
            <div className="flex items-center gap-3 text-sm">
              <Link href="/login" className="text-gray-400 hover:text-white transition">Log in</Link>
              <Link href="/register" className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition" style={{ backgroundColor: '#FF8000' }}>Register</Link>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block mb-4 px-3 py-1.5 rounded-full text-xs font-bold tracking-widest border border-orange-500/30 bg-orange-500/10" style={{ color: '#FF8000' }}>
              COACH PLAN
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2">Start your free trial</h1>
            <p className="text-gray-400">14 days free · cancel any time</p>
          </div>

          {cancelled && (
            <div className="mb-6 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-300 text-center">
              Checkout cancelled — no charge was made.
            </div>
          )}

          {/* Plan toggle */}
          <div className="flex rounded-xl border border-gray-700 overflow-hidden mb-6">
            {(['STARTER', 'PRO'] as Plan[]).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPlan(p)}
                className={`flex-1 py-3 text-sm font-semibold transition ${
                  selectedPlan === p
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {p === 'STARTER' ? 'Starter — $19/mo' : 'Pro — $35/mo'}
              </button>
            ))}
          </div>

          {/* Currency + Period toggles */}
          <div className="flex gap-3 mb-6">
            <div className="flex rounded-lg border border-gray-700 overflow-hidden flex-1">
              {(['AUD', 'USD'] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`flex-1 py-2 text-xs font-semibold transition ${
                    currency === c ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg border border-gray-700 overflow-hidden flex-1">
              {(['monthly', 'annual'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 py-2 text-xs font-semibold transition ${
                    period === p ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {p === 'annual' ? `Annual (${annualSaving}% off)` : 'Monthly'}
                </button>
              ))}
            </div>
          </div>

          {/* Plan card */}
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs text-gray-500 mb-0.5">{info.tagline}</div>
                <div className="text-lg font-bold text-white">{info.name}</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-white">
                  {currency === 'AUD' ? 'A$' : '$'}{displayPrice}
                  <span className="text-base font-normal text-gray-400">/mo</span>
                </div>
                {period === 'annual' && (
                  <div className="text-xs text-orange-400">billed annually</div>
                )}
              </div>
            </div>

            <ul className="space-y-2">
              {info.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-700 rounded-xl text-sm text-red-300">
              {error}
            </div>
          )}

          {status === 'loading' ? (
            <div className="w-full py-4 rounded-xl bg-gray-800 text-gray-500 text-center text-sm font-semibold">
              Loading...
            </div>
          ) : !session ? (
            <div className="space-y-3">
              <p className="text-center text-sm text-gray-400 mb-4">
                Create an account or log in to start your trial
              </p>
              <Link
                href={`/register?callbackUrl=${encodeURIComponent(`/coach-subscribe?plan=${selectedPlan.toLowerCase()}`)}`}
                className="block w-full py-4 rounded-xl font-semibold text-center text-white hover:opacity-90 transition"
                style={{ backgroundColor: '#FF8000' }}
              >
                Create account
              </Link>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/coach-subscribe?plan=${selectedPlan.toLowerCase()}`)}`}
                className="block w-full py-4 rounded-xl font-semibold text-center bg-gray-800 text-gray-200 hover:bg-gray-700 transition border border-gray-700"
              >
                Log in
              </Link>
            </div>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-4 rounded-xl font-semibold text-white hover:opacity-90 transition disabled:opacity-60"
              style={{ backgroundColor: '#FF8000' }}
            >
              {loading ? 'Redirecting to checkout...' : 'Start 14-day free trial'}
            </button>
          )}

          <p className="text-center text-xs text-gray-600 mt-4">
            No charge during trial · cancel any time
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CoachSubscribePage() {
  return (
    <Suspense>
      <CoachSubscribeInner />
    </Suspense>
  )
}
