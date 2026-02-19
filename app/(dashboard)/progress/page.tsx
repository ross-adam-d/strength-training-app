'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface Exercise {
  id: string
  name: string
}

interface ExerciseLog {
  id: string
  setNumber: number
  reps: number
  repsLeft: number | null
  repsRight: number | null
  weight: number
  skipped: boolean
  exerciseRpe: number | null
  workoutLog: {
    completedAt: string
  }
}

interface WorkoutLog {
  id: string
  completedAt: string
  duration?: number
  overallRpe?: number
  workout: { name: string } | null
  exerciseLogs: Array<{
    exercise: { name: string }
    weight: number
    reps: number
  }>
}

interface ComparisonItem {
  id: string
  name: string
  label: string
  subtitle?: string
  status: string
  sessionsCompleted: number
  totalVolumeKg: number
  weeklyAvgVolumeKg: number
  avgWorkoutRpe: number | null
}

type ComparisonType = 'blocks' | 'phases' | 'weeks'

const TIME_PERIODS = [
  { value: '4w', label: 'Last 4 weeks' },
  { value: '3m', label: 'Last 3 months' },
  { value: 'all', label: 'All time' },
]

const COMPARISON_OPTIONS = [
  { value: 'blocks', label: 'Block vs Block' },
  { value: 'phases', label: 'Phase vs Phase' },
  { value: 'weeks', label: 'Weeks in Phase' },
]

const RPE_LABELS: Record<number, string> = {
  1: 'Too Easy',
  2: 'Easy',
  3: 'Just Right',
  4: 'Hard',
  5: 'Too Much',
}

function getSinceDate(period: string): string | null {
  const now = new Date()
  if (period === '4w') {
    now.setDate(now.getDate() - 28)
    return now.toISOString()
  }
  if (period === '3m') {
    now.setMonth(now.getMonth() - 3)
    return now.toISOString()
  }
  return null
}

function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

function statusColour(status: string) {
  if (status === 'active') return '#22c55e'
  if (status === 'completed') return '#3b82f6'
  return '#94a3b8'
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function ProgressPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([])
  const [comparisonData, setComparisonData] = useState<ComparisonItem[]>([])
  const [comparisonType, setComparisonType] = useState<ComparisonType>('blocks')
  const [timePeriod, setTimePeriod] = useState<string>('3m')
  const [loading, setLoading] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [loadingComparison, setLoadingComparison] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Initial load: exercises (logged only) + recent workouts
  useEffect(() => {
    async function loadInitial() {
      try {
        const [exercisesRes, workoutsRes] = await Promise.all([
          fetch('/api/exercises?logged=true'),
          fetch('/api/workout-logs?limit=50'),
        ])
        if (exercisesRes.ok) {
          const data = await exercisesRes.json()
          setExercises(data)
          if (data.length > 0) setSelectedExercise(data[0].id)
        }
        if (workoutsRes.ok) setRecentWorkouts(await workoutsRes.json())
      } catch (error) {
        console.error('Error loading progress data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadInitial()
  }, [])

  // Fetch comparison data whenever type changes (including on mount)
  useEffect(() => {
    let cancelled = false
    setLoadingComparison(true)
    fetch(`/api/progress/block-comparison?type=${comparisonType}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => { if (!cancelled) setComparisonData(data) })
      .catch((err) => console.error('Comparison fetch error:', err))
      .finally(() => { if (!cancelled) setLoadingComparison(false) })
    return () => { cancelled = true }
  }, [comparisonType])

  // Fetch exercise logs whenever exercise or time period changes
  const fetchExerciseLogs = useCallback(async (exerciseId: string, period: string) => {
    if (!exerciseId) return
    setLoadingLogs(true)
    try {
      const since = getSinceDate(period)
      const url = since
        ? `/api/exercises/${exerciseId}/logs?since=${encodeURIComponent(since)}`
        : `/api/exercises/${exerciseId}/logs`
      const res = await fetch(url)
      if (res.ok) setExerciseLogs(await res.json())
    } catch (error) {
      console.error('Error fetching exercise logs:', error)
    } finally {
      setLoadingLogs(false)
    }
  }, [])

  useEffect(() => {
    fetchExerciseLogs(selectedExercise, timePeriod)
  }, [selectedExercise, timePeriod, fetchExerciseLogs])

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
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExporting(false)
    }
  }

  // Filter recent workouts by time period
  const filteredWorkouts = recentWorkouts.filter((w) => {
    const since = getSinceDate(timePeriod)
    if (!since) return true
    return new Date(w.completedAt) >= new Date(since)
  })

  // Aggregate exercise chart data — group by session date, best set per session
  const weightProgressData = exerciseLogs.reduce(
    (acc: { date: string; maxWeight: number; estimated1RM: number }[], log) => {
      const date = formatDate(log.workoutLog.completedAt)
      const existing = acc.find((item) => item.date === date)
      const est1RM = calculate1RM(log.weight, log.reps)
      if (existing) {
        if (log.weight > existing.maxWeight) {
          existing.maxWeight = log.weight
          existing.estimated1RM = est1RM
        }
      } else {
        acc.push({ date, maxWeight: log.weight, estimated1RM: est1RM })
      }
      return acc
    },
    []
  )

  const volumeData = exerciseLogs.reduce(
    (acc: { date: string; volume: number; sets: number }[], log) => {
      const date = formatDate(log.workoutLog.completedAt)
      const existing = acc.find((item) => item.date === date)
      const vol = log.weight * log.reps
      if (existing) {
        existing.volume += vol
        existing.sets += 1
      } else {
        acc.push({ date, volume: Math.round(vol), sets: 1 })
      }
      return acc
    },
    []
  )

  // RPE trend: first set's exerciseRpe per session date
  const rpeData = exerciseLogs.reduce(
    (acc: { date: string; rpe: number }[], log) => {
      if (log.exerciseRpe === null || log.setNumber !== 1) return acc
      const date = formatDate(log.workoutLog.completedAt)
      if (!acc.find((item) => item.date === date)) {
        acc.push({ date, rpe: log.exerciseRpe })
      }
      return acc
    },
    []
  )

  // Performance summary derived from non-skipped logs
  const validLogs = exerciseLogs.filter((l) => !l.skipped && l.weight > 0 && l.reps > 0)
  const sessionDates = [...new Set(validLogs.map((l) => l.workoutLog.completedAt.slice(0, 10)))]

  const performanceSummary = (() => {
    if (validLogs.length === 0 || sessionDates.length < 2) return null

    const firstDate = sessionDates[0]
    const lastDate = sessionDates[sessionDates.length - 1]

    const firstLogs = validLogs.filter((l) => l.workoutLog.completedAt.slice(0, 10) === firstDate)
    const lastLogs = validLogs.filter((l) => l.workoutLog.completedAt.slice(0, 10) === lastDate)

    const firstWeight = Math.max(...firstLogs.map((l) => l.weight))
    const lastWeight = Math.max(...lastLogs.map((l) => l.weight))
    const weightChange = firstWeight > 0 ? ((lastWeight - firstWeight) / firstWeight) * 100 : 0

    const firstBestLog = firstLogs.reduce((best, l) =>
      calculate1RM(l.weight, l.reps) > calculate1RM(best.weight, best.reps) ? l : best
    )
    const lastBestLog = lastLogs.reduce((best, l) =>
      calculate1RM(l.weight, l.reps) > calculate1RM(best.weight, best.reps) ? l : best
    )
    const first1RM = calculate1RM(firstBestLog.weight, firstBestLog.reps)
    const last1RM = calculate1RM(lastBestLog.weight, lastBestLog.reps)
    const rmChange = first1RM > 0 ? ((last1RM - first1RM) / first1RM) * 100 : 0

    const allTimeMaxWeight = Math.max(...validLogs.map((l) => l.weight))
    const isPR = lastWeight >= allTimeMaxWeight && lastWeight > firstWeight

    return {
      firstWeight,
      lastWeight,
      weightChange,
      first1RM,
      last1RM,
      rmChange,
      isPR,
      sessionCount: sessionDates.length,
    }
  })()

  // Comparison chart helpers
  const comparisonItems = comparisonData.filter((b) => b.sessionsCompleted > 0)
  const isWeeks = comparisonType === 'weeks'
  const volumeChartLabel = isWeeks ? 'Volume (kg)' : 'Weekly Avg (kg)'
  const xAxisAngleProps = isWeeks
    ? {}
    : { angle: -30, textAnchor: 'end' as const, interval: 0 }
  const chartMargin = isWeeks
    ? { top: 4, right: 8, left: 0, bottom: 4 }
    : { top: 4, right: 8, left: 0, bottom: 40 }

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

  // Total volume in kg across filtered workouts (for T conversion)
  const totalVolumeKg = filteredWorkouts.reduce(
    (sum, w) => sum + w.exerciseLogs.reduce((s, l) => s + l.weight * l.reps, 0),
    0
  )

  return (
    <div>
      {/* Row 1: Title + Export CSV */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* Row 2: Time period */}
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
            <p className="text-2xl font-bold text-primary-600 text-center mt-1">
              {(() => {
                const withRpe = filteredWorkouts.filter((w) => w.overallRpe)
                if (withRpe.length === 0) return '—'
                const avg =
                  withRpe.reduce((s, w) => s + (w.overallRpe || 0), 0) / withRpe.length
                return avg.toFixed(1)
              })()}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Exercise progress */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900 shrink-0">Exercise Progress</h2>
            <div className="flex-1 max-w-xs">
              <Select
                options={[
                  { value: '', label: 'Select exercise...' },
                  ...exercises.map((ex) => ({ value: ex.id, label: ex.name })),
                ]}
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {loadingLogs ? (
            <div className="text-center py-8 text-sm text-gray-500">Loading...</div>
          ) : weightProgressData.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              No data for this exercise in the selected period.
            </div>
          ) : (
            <div className="space-y-8">
              {/* Performance summary */}
              {performanceSummary && (
                <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Top Weight</p>
                    <p className="text-lg font-bold text-gray-900">
                      {performanceSummary.lastWeight} kg
                    </p>
                    <p
                      className={`text-xs font-medium mt-0.5 ${
                        performanceSummary.weightChange >= 0 ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {performanceSummary.weightChange >= 0 ? '+' : ''}
                      {performanceSummary.weightChange.toFixed(1)}%
                      {performanceSummary.isPR && (
                        <span className="ml-1 bg-amber-100 text-amber-700 text-xs px-1 py-0.5 rounded">
                          PR
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Est. 1RM</p>
                    <p className="text-lg font-bold text-gray-900">
                      {performanceSummary.last1RM} kg
                    </p>
                    <p
                      className={`text-xs font-medium mt-0.5 ${
                        performanceSummary.rmChange >= 0 ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {performanceSummary.rmChange >= 0 ? '+' : ''}
                      {performanceSummary.rmChange.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Sessions</p>
                    <p className="text-lg font-bold text-gray-900">
                      {performanceSummary.sessionCount}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">logged</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-gray-500 mb-3">
                  Max Weight & Estimated 1RM (kg)
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={weightProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={40} />
                    <Tooltip />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="maxWeight"
                      stroke="#0ea5e9"
                      name="Max Weight (kg)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="estimated1RM"
                      stroke="#8b5cf6"
                      name="Est. 1RM (kg)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-3">Session Volume (kg)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={40} />
                    <Tooltip />
                    <Bar dataKey="volume" fill="#0ea5e9" name="Volume (kg)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {rpeData.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-3">Exercise RPE (1–5)</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={rpeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        domain={[1, 5]}
                        width={30}
                        ticks={[1, 2, 3, 4, 5]}
                      />
                      <Tooltip
                        formatter={(val: number) => {
                          const label = RPE_LABELS[Math.round(val)] || ''
                          return [`${val} — ${label}`, 'RPE']
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rpe"
                        stroke="#f59e0b"
                        name="RPE"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Training comparison */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Training Comparison</h2>
              {isWeeks && comparisonData.length > 0 && comparisonData[0].subtitle && (
                <p className="text-xs text-gray-500 mt-0.5">{comparisonData[0].subtitle}</p>
              )}
            </div>
            <div className="w-44 shrink-0">
              <Select
                options={COMPARISON_OPTIONS}
                value={comparisonType}
                onChange={(e) => setComparisonType(e.target.value as ComparisonType)}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {loadingComparison ? (
            <div className="text-center py-8 text-sm text-gray-500">Loading...</div>
          ) : comparisonItems.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No data to compare yet.
            </div>
          ) : (
            <div className="space-y-8">
              {/* Volume chart */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-3">{volumeChartLabel}</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={comparisonItems} margin={chartMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} {...xAxisAngleProps} />
                    <YAxis tick={{ fontSize: 11 }} width={50} />
                    <Tooltip
                      formatter={(val: number) => [`${val.toLocaleString()} kg`, volumeChartLabel]}
                      labelFormatter={(label) => {
                        const item = comparisonItems.find((b) => b.label === label)
                        if (!item) return label
                        return item.subtitle ? `${item.name} — ${item.subtitle}` : item.name
                      }}
                    />
                    <Bar
                      dataKey="weeklyAvgVolumeKg"
                      name={volumeChartLabel}
                      radius={[3, 3, 0, 0]}
                    >
                      {comparisonItems.map((b) => (
                        <Cell key={b.id} fill={statusColour(b.status)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* RPE chart */}
              {comparisonItems.some((b) => b.avgWorkoutRpe !== null) && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-3">Avg Workout RPE (1–5)</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={comparisonItems} margin={chartMargin}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} {...xAxisAngleProps} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 5]} width={30} />
                      <Tooltip
                        formatter={(val: number) => {
                          const rpeLabel = RPE_LABELS[Math.round(val)] || ''
                          return [`${val} — ${rpeLabel}`, 'Avg RPE']
                        }}
                        labelFormatter={(label) => {
                          const item = comparisonItems.find((b) => b.label === label)
                          if (!item) return label
                          return item.subtitle ? `${item.name} — ${item.subtitle}` : item.name
                        }}
                      />
                      <Bar dataKey="avgWorkoutRpe" name="Avg RPE" radius={[3, 3, 0, 0]}>
                        {comparisonItems.map((b) => (
                          <Cell key={b.id} fill={statusColour(b.status)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-sm inline-block"
                    style={{ background: '#22c55e' }}
                  />
                  Active
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-sm inline-block"
                    style={{ background: '#3b82f6' }}
                  />
                  Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-sm inline-block"
                    style={{ background: '#94a3b8' }}
                  />
                  Planned
                </span>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Recent workouts */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Recent Workouts</h2>
        </CardHeader>
        <CardBody>
          {filteredWorkouts.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">No workouts in this period</div>
          ) : (
            <div className="divide-y">
              {filteredWorkouts.slice(0, 20).map((workout) => (
                <div key={workout.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {workout.workout?.name ?? 'Manual Workout'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(workout.completedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {workout.exerciseLogs.length > 0 &&
                        ` · ${workout.exerciseLogs.length} exercise${workout.exerciseLogs.length !== 1 ? 's' : ''}`}
                      {workout.duration && ` · ${workout.duration} min`}
                    </p>
                  </div>
                  {workout.overallRpe != null && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ml-3 shrink-0 ${
                        workout.overallRpe <= 2
                          ? 'bg-green-100 text-green-800'
                          : workout.overallRpe <= 3
                          ? 'bg-blue-100 text-blue-800'
                          : workout.overallRpe <= 4
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      RPE {workout.overallRpe.toFixed(1)} ·{' '}
                      {RPE_LABELS[Math.round(workout.overallRpe)] ?? ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
