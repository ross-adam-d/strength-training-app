'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

export default function ClientProgressPage() {
  const params = useParams()
  const clientId = params.clientId as string

  const [activeTab, setActiveTab] = useState<Tab>('volume')
  const [timePeriod, setTimePeriod] = useState('3m')
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/coach/clients/${clientId}/workout-logs?limit=50`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setRecentWorkouts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clientId])

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
    return (withRpe.reduce((s, w) => s + (w.overallRpe || 0), 0) / withRpe.length).toFixed(1)
  })()

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-lg p-6 h-24" />)}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
      </div>

      <div className="flex justify-end mb-6">
        <div className="w-44">
          <Select
            options={TIME_PERIODS.map((p) => ({ value: p.value, label: p.label }))}
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardBody>
            <p className="text-xs text-gray-500 text-center">Sessions</p>
            <p className="text-2xl font-bold text-primary-600 text-center mt-1">{filteredWorkouts.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-gray-500 text-center">Volume</p>
            <p className="text-2xl font-bold text-primary-600 text-center mt-1">{(totalVolumeKg / 1000).toFixed(1)}T</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-gray-500 text-center">Avg RPE</p>
            <p className="text-2xl font-bold text-primary-600 text-center mt-1">{avgRpe}</p>
          </CardBody>
        </Card>
      </div>

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

      {activeTab === 'volume' && (
        <VolumeTab timePeriod={timePeriod} filteredWorkouts={filteredWorkouts} clientId={clientId} />
      )}
      {activeTab === 'exercise' && <ExerciseTab timePeriod={timePeriod} clientId={clientId} />}
      {activeTab === 'analytics' && <AnalyticsTab timePeriod={timePeriod} clientId={clientId} />}
    </div>
  )
}
