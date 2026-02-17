'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Subscription = {
  id: string
  status: string
  trialEndsAt: string
  manualAccessGrantedUntil: string | null
  cancelledAt: string | null
  createdAt: string
}

type UserDetail = {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  subscription: Subscription | null
  macrocycles: Array<{
    id: string
    name: string
    startDate: string
    endDate: string
    status: string
  }>
  workoutLogs: Array<{
    id: string
    completedAt: string
    duration: number | null
    overallRpe: number | null
    workout: { name: string } | null
  }>
}

const STATUS_OPTIONS = ['TRIALING', 'ACTIVE', 'READ_ONLY', 'CANCELLED'] as const

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form state
  const [status, setStatus] = useState<string>('TRIALING')
  const [trialEndsAt, setTrialEndsAt] = useState('')
  const [manualAccessDate, setManualAccessDate] = useState('')
  const [clearManualAccess, setClearManualAccess] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((data: UserDetail) => {
        setUser(data)
        if (data.subscription) {
          setStatus(data.subscription.status)
          setTrialEndsAt(toDateInputValue(data.subscription.trialEndsAt))
          setManualAccessDate(toDateInputValue(data.subscription.manualAccessGrantedUntil))
        }
      })
      .catch(() => setError('Failed to load user'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccessMsg(null)

    const body: Record<string, unknown> = { status }

    if (trialEndsAt) {
      body.trialEndsAt = new Date(trialEndsAt).toISOString()
    }

    if (clearManualAccess) {
      body.manualAccessGrantedUntil = null
    } else if (manualAccessDate) {
      // Set to end of day
      const d = new Date(manualAccessDate)
      d.setHours(23, 59, 59, 999)
      body.manualAccessGrantedUntil = d.toISOString()
    }

    const res = await fetch(`/api/admin/users/${id}/subscription`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const updated: Subscription = await res.json()
      setUser((prev) => prev ? { ...prev, subscription: updated } : prev)
      setSuccessMsg('Subscription updated.')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to save')
    }

    setSaving(false)
  }

  function extendTrial(days: number) {
    const base = user?.subscription?.trialEndsAt
      ? new Date(user.subscription.trialEndsAt)
      : new Date()
    if (base < new Date()) {
      // If already expired, extend from today
      base.setTime(new Date().getTime())
    }
    base.setDate(base.getDate() + days)
    setTrialEndsAt(base.toISOString().slice(0, 10))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <p className="text-gray-500">User not found.</p>
  }

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to users
      </Link>

      {/* User header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user.name ?? 'No name'}</h2>
            <p className="text-gray-500 text-sm">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">Joined {formatDate(user.createdAt)}</p>
          </div>
          {user.role === 'ADMIN' && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
              Admin
            </span>
          )}
        </div>
      </div>

      {/* Subscription controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          Subscription
        </h3>

        {user.subscription ? (
          <div className="space-y-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Trial ends */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trial ends</label>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="date"
                  value={trialEndsAt}
                  onChange={(e) => setTrialEndsAt(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => extendTrial(7)}
                  className="px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  +7 days
                </button>
                <button
                  type="button"
                  onClick={() => extendTrial(14)}
                  className="px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  +14 days
                </button>
                <button
                  type="button"
                  onClick={() => extendTrial(28)}
                  className="px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  +28 days
                </button>
              </div>
            </div>

            {/* Manual override */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manual access granted until
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="date"
                  value={clearManualAccess ? '' : manualAccessDate}
                  onChange={(e) => {
                    setManualAccessDate(e.target.value)
                    setClearManualAccess(false)
                  }}
                  disabled={clearManualAccess}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-40"
                />
                {(manualAccessDate || user.subscription.manualAccessGrantedUntil) && (
                  <button
                    type="button"
                    onClick={() => {
                      setClearManualAccess(true)
                      setManualAccessDate('')
                    }}
                    className="text-xs text-red-600 hover:text-red-700 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Overrides all other checks — user gets full access until this date.
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No subscription record found for this user.</p>
        )}
      </div>

      {/* Training blocks */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          Training Blocks
        </h3>
        {user.macrocycles.length === 0 ? (
          <p className="text-sm text-gray-400">No training blocks.</p>
        ) : (
          <div className="space-y-2">
            {user.macrocycles.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(m.startDate)} – {formatDate(m.endDate)}
                  </p>
                </div>
                <span className="text-xs text-gray-500 capitalize">{m.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent workouts */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          Recent Workout Logs
        </h3>
        {user.workoutLogs.length === 0 ? (
          <p className="text-sm text-gray-400">No workout logs.</p>
        ) : (
          <div className="space-y-2">
            {user.workoutLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {log.workout?.name ?? 'Manual workout'}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(log.completedAt)}</p>
                </div>
                <div className="text-xs text-gray-500 text-right">
                  {log.duration ? `${log.duration} min` : ''}
                  {log.overallRpe ? ` · RPE ${log.overallRpe}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
