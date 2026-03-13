'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardBody } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import VolumeTab from '@/components/progress/VolumeTab'
import ExerciseTab from '@/components/progress/ExerciseTab'
import AnalyticsTab from '@/components/progress/AnalyticsTab'

type Tab = 'volume' | 'exercise' | 'analytics'

const TABS: { id: Tab; label: string }[] = [
  { id: 'volume', label: 'Volume & Intensity' },
  { id: 'exercise', label: 'Exercise Metrics' },
  { id: 'analytics', label: 'Deep Analytics' },
]

const TIME_PERIODS = [
  { value: '4w', label: 'Last 4 weeks' },
  { value: '3m', label: 'Last 3 months' },
  { value: 'all', label: 'All time' },
]

const RPE_LABELS: Record<number, string> = {
  1: 'Too Easy',
  2: 'Easy',
  3: 'Just Right',
  4: 'Hard',
  5: 'Too Much',
}

interface WorkoutLog {
  id: string
  completedAt: string
  duration?: number
  overallRpe?: number
  workout: { name: string } | null
  exerciseLogs: Array<{ exercise: { name: string }; weight: number; reps: number }>
}

function getSinceDate(period: string): string | null {
  const now = new Date()
  if (period === '4w') { now.setDate(now.getDate() - 28); return now.toISOString() }
  if (period === '3m') { now.setMonth(now.getMonth() - 3); return now.toISOString() }
  return null
}

export default function ProgressPage() {
  const { data: session } = useSession()
  const isBasic = (session?.user as any)?.tier === 'BASIC'

  const [activeTab, setActiveTab] = useState<Tab>('volume')
  const [timePeriod, setTimePeriod] = useState('3m')
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetch('/api/workout-logs?limit=50')
      .then((r) => (r.ok ? r.json() : []))
      .then(setRecentWorkouts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/export/workout-logs')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const today = new Date().toISOString().slice(0, 10)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `problock-export-${today}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export error:', e)
    } finally {
      setExporting(false)
    }
  }

  const filteredWorkouts = recentWorkouts.filter((w) => {
    const since = getSinceDate(timePeriod)
    if (!since) return true
    return new Date(w.completedAt) >= new Date(since)
  })

  const totalVolumeKg = filteredWorkouts.reduce(
    (sum, w) => sum + w.exerciseLogs.reduce((s, l) => s + l.weight * l.reps, 0),
    0
  )

  const avgRpe = (() => {
    const withRpe = filteredWorkouts.filter((w) => w.overallRpe)
    if (withRpe.length === 0) return '—'
    const avg = withRpe.reduce((s, w) => s + (w.overallRpe || 0), 0) / withRpe.length
    return avg.toFixed(1)
  })()

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-24"></div>
          ))}
        </div>
      </div>
    )
  }

  if (isBasic) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Progress</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-md mx-auto">
          <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="inline-block mb-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">Elite</span>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Progress tracking is an Elite feature</h2>
          <p className="text-gray-500 text-sm mb-6">
            Upgrade to Elite to unlock charts, trends, and deep analytics across your entire training history.
          </p>
          <ul className="text-left space-y-2 mb-6 text-sm text-gray-600">
            {[
              'Volume & intensity trends over time',
              'Exercise-level strength progression',
              '1RM tracking & all-time PRs',
              'Deep analytics & training readiness',
              'Export your full training history',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <a
            href="/subscribe"
            className="inline-block w-full text-center px-6 py-3 rounded-lg font-semibold text-sm text-white hover:opacity-90 transition"
            style={{ backgroundColor: '#FF8000' }}
          >
            Upgrade to Elite — $16/mo
          </a>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
          <Link
            href="/how-to#progress"
            className="text-xs text-gray-400 hover:text-primary-600 hover:underline transition"
            title="How to read your progress"
          >
            ? How to read this
          </Link>
        </div>
        {isBasic ? (
          <span
            title="CSV export is an Elite feature"
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
          >
            Export CSV
            <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200">Elite</span>
          </span>
        ) : (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        )}
      </div>

      {/* Time period */}
      <div className="flex justify-end mb-6">
        <div className="w-44">
          <Select
            options={TIME_PERIODS.map((p) => ({ value: p.value, label: p.label }))}
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
          />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardBody>
            <p className="text-xs text-gray-500 text-center">Sessions</p>
            <p className="text-2xl font-bold text-primary-600 text-center mt-1">
              {filteredWorkouts.length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-gray-500 text-center">Volume</p>
            <p className="text-2xl font-bold text-primary-600 text-center mt-1">
              {(totalVolumeKg / 1000).toFixed(1)}T
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-gray-500 text-center">Avg RPE</p>
            <p className="text-2xl font-bold text-primary-600 text-center mt-1">{avgRpe}</p>
          </CardBody>
        </Card>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'volume' && (
        <VolumeTab timePeriod={timePeriod} filteredWorkouts={filteredWorkouts} />
      )}
      {activeTab === 'exercise' && <ExerciseTab timePeriod={timePeriod} />}
      {activeTab === 'analytics' && <AnalyticsTab timePeriod={timePeriod} />}
    </div>
  )
}
