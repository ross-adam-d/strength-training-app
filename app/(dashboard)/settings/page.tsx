'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [billingLoading, setBillingLoading] = useState(false)
  const [unitSaving, setUnitSaving] = useState(false)
  const [unitError, setUnitError] = useState<string | null>(null)

  const user = session?.user
  const unitPreference = (user?.unitPreference ?? 'metric') as 'metric' | 'imperial'
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
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
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
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
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
    </div>
  )
}
