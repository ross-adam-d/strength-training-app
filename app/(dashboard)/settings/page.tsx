'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [billingLoading, setBillingLoading] = useState(false)
  const [unitSaving, setUnitSaving] = useState(false)
  const [unitError, setUnitError] = useState<string | null>(null)
  const [overloadSaving, setOverloadSaving] = useState(false)
  const [overloadError, setOverloadError] = useState<string | null>(null)
  const [referralLink, setReferralLink] = useState<string | null>(null)
  const [referralCount, setReferralCount] = useState<number>(0)
  const [referralCopied, setReferralCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referrals')
      .then((r) => r.json())
      .then((d) => {
        if (d.referralLink) setReferralLink(d.referralLink)
        setReferralCount(d.referralCount ?? 0)
      })
      .catch(() => {})
  }, [])

  const user = session?.user
  const unitPreference = (user?.unitPreference ?? 'metric') as 'metric' | 'imperial'
  const overloadTrigger = ((user as any)?.overloadTrigger ?? 'topOfRange') as 'topOfRange' | 'allSetsTop' | 'combo'
  const rpeAutoDeload = (user as any)?.rpeAutoDeload ?? false
  const subscriptionStatus = user?.subscriptionStatus
  const tier = user?.tier ?? 'PREMIERE'

  const showBilling =
    subscriptionStatus === 'ACTIVE' ||
    subscriptionStatus === 'PAST_DUE' ||
    subscriptionStatus === 'TRIALING' ||
    subscriptionStatus === 'CANCELLED'

  async function manageBilling() {
    setBillingLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      if (res.status === 404) {
        window.location.assign('/subscribe')
        return
      }
      if (!res.ok) {
        alert('Unable to open billing portal. Please try again.')
        return
      }
      const data = await res.json()
      if (data.url) window.location.assign(data.url)
    } finally {
      setBillingLoading(false)
    }
  }

  async function setUnit(pref: 'metric' | 'imperial') {
    if (pref === unitPreference) return
    setUnitSaving(true)
    setUnitError(null)
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitPreference: pref }),
      })
      if (!res.ok) {
        setUnitError('Failed to save preference. Please try again.')
        return
      }
      // Refresh the session so unitPreference updates everywhere
      await update()
    } catch {
      setUnitError('Failed to save preference. Please try again.')
    } finally {
      setUnitSaving(false)
    }
  }

  async function setTrigger(val: 'topOfRange' | 'allSetsTop' | 'combo') {
    if (val === overloadTrigger) return
    setOverloadSaving(true)
    setOverloadError(null)
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overloadTrigger: val }),
      })
      if (!res.ok) { setOverloadError('Failed to save. Please try again.'); return }
      await update()
    } catch {
      setOverloadError('Failed to save. Please try again.')
    } finally {
      setOverloadSaving(false)
    }
  }

  async function toggleDeload() {
    setOverloadSaving(true)
    setOverloadError(null)
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rpeAutoDeload: !rpeAutoDeload }),
      })
      if (!res.ok) { setOverloadError('Failed to save. Please try again.'); return }
      await update()
    } catch {
      setOverloadError('Failed to save. Please try again.')
    } finally {
      setOverloadSaving(false)
    }
  }

  async function copyReferralLink() {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setReferralCopied(true)
      setTimeout(() => setReferralCopied(false), 2000)
    } catch {
      // fallback: select the text
    }
  }

  function planLabel() {
    if (!subscriptionStatus) return 'No active plan'
    const tierLabel = tier === 'BASIC' ? 'Core' : 'Elite'
    const statusLabel: Record<string, string> = {
      TRIALING: 'Trial',
      ACTIVE: 'Active',
      PAST_DUE: 'Past Due',
      CANCELLED: 'Cancelled',
      READ_ONLY: 'Read Only',
    }
    return `${tierLabel} — ${statusLabel[subscriptionStatus] ?? subscriptionStatus}`
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Account */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Account</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Email address</p>
            <p className="mt-1 font-medium text-gray-900">{user?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Password</p>
            <a
              href="/forgot-password"
              className="mt-1 inline-block text-sm font-medium text-primary-600 hover:text-primary-700 underline"
            >
              Send password reset email
            </a>
          </div>
        </CardBody>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Current plan</p>
            <p className="mt-1 font-medium text-gray-900">{planLabel()}</p>
          </div>
          {!subscriptionStatus && (
            <a
              href="/subscribe"
              className="inline-block px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition"
            >
              Subscribe
            </a>
          )}
          {showBilling && (
            <button
              onClick={manageBilling}
              disabled={billingLoading}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition disabled:opacity-60"
            >
              {billingLoading ? 'Loading…' : 'Manage Billing'}
            </button>
          )}
        </CardBody>
      </Card>

      {/* Units */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Units</h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose how weights are displayed throughout the app.
          </p>
        </CardHeader>
        <CardBody>
          <div className="flex gap-3">
            <button
              onClick={() => setUnit('metric')}
              disabled={unitSaving}
              className={`flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition ${
                unitPreference === 'metric'
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              } disabled:opacity-60`}
            >
              Metric (kg)
            </button>
            <button
              onClick={() => setUnit('imperial')}
              disabled={unitSaving}
              className={`flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition ${
                unitPreference === 'imperial'
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              } disabled:opacity-60`}
            >
              Imperial (lbs)
            </button>
          </div>
          {unitSaving && (
            <p className="mt-2 text-sm text-gray-500">Saving…</p>
          )}
          {unitError && (
            <p className="mt-2 text-sm text-red-600">{unitError}</p>
          )}
        </CardBody>
      </Card>

      {/* Refer a Friend */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Refer a Friend</h2>
          <p className="mt-1 text-sm text-gray-500">
            Share your link — you both get 30 days free when they verify their email.
          </p>
        </CardHeader>
        <CardBody className="space-y-4">
          {referralLink ? (
            <>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={referralLink}
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-700 truncate focus:outline-none"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-md hover:bg-primary-700 transition whitespace-nowrap"
                >
                  {referralCopied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-sm text-gray-500">
                {referralCount === 0
                  ? 'No one has signed up using your link yet.'
                  : referralCount === 1
                  ? '1 friend has joined using your link — nice!'
                  : `${referralCount} friends have joined using your link — legend!`}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Loading your referral link…</p>
          )}
        </CardBody>
      </Card>

      {/* Progressive Overload */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Progressive Overload</h2>
          <p className="mt-1 text-sm text-gray-500">
            Control when weight increases are suggested during your workouts.
          </p>
        </CardHeader>
        <CardBody className="space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Weight increase trigger</p>
            <div className="flex gap-2">
              {([
                { value: 'topOfRange' as const, label: 'Top of range', desc: 'Set 1 hits the top' },
                { value: 'allSetsTop' as const, label: 'All sets at top', desc: 'Every set hits the top' },
                { value: 'combo' as const, label: 'Combo', desc: 'One at top + all above min' },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTrigger(opt.value)}
                  disabled={overloadSaving}
                  className={`flex-1 py-3 px-2 rounded-lg border-2 text-sm font-semibold transition ${
                    overloadTrigger === opt.value
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  } disabled:opacity-60`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {overloadTrigger === 'topOfRange' && 'Increase weight when set 1 hits the top of your rep range.'}
              {overloadTrigger === 'allSetsTop' && 'Increase weight only when every set hits the top of the range.'}
              {overloadTrigger === 'combo' && 'Increase weight when at least one set hits the top and all sets are at or above the minimum.'}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Auto-deload on &quot;Too Much&quot;</p>
              <p className="text-xs text-gray-500">Reduce weight next session when you rate an exercise 5/5</p>
            </div>
            <button
              onClick={toggleDeload}
              disabled={overloadSaving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                rpeAutoDeload ? 'bg-primary-600' : 'bg-gray-200'
              } disabled:opacity-60`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  rpeAutoDeload ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {overloadSaving && (
            <p className="text-sm text-gray-500">Saving…</p>
          )}
          {overloadError && (
            <p className="text-sm text-red-600">{overloadError}</p>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
