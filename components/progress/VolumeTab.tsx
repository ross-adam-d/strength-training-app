'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface WorkoutLog {
  id: string
  completedAt: string
  duration?: number
  overallRpe?: number
  workout: { name: string } | null
  exerciseLogs: Array<{ exercise: { name: string }; weight: number; reps: number }>
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

interface MuscleVolumeItem {
  muscleGroup: string
  avgSetsPerWeek: number
  totalSets: number
}

type ComparisonType = 'blocks' | 'phases' | 'weeks'

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

function statusColour(status: string) {
  if (status === 'active') return '#22c55e'
  if (status === 'completed') return '#3b82f6'
  return '#94a3b8'
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

interface Props {
  timePeriod: string
  filteredWorkouts: WorkoutLog[]
}

export default function VolumeTab({ timePeriod, filteredWorkouts }: Props) {
  const [comparisonData, setComparisonData] = useState<ComparisonItem[]>([])
  const [comparisonType, setComparisonType] = useState<ComparisonType>('blocks')
  const [loadingComparison, setLoadingComparison] = useState(false)
  const [muscleVolumeData, setMuscleVolumeData] = useState<MuscleVolumeItem[]>([])
  const [loadingMuscle, setLoadingMuscle] = useState(false)

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

  useEffect(() => {
    let cancelled = false
    setLoadingMuscle(true)
    fetch(`/api/progress/muscle-volume?period=${timePeriod}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => { if (!cancelled) setMuscleVolumeData(data) })
      .catch((err) => console.error('Muscle volume fetch error:', err))
      .finally(() => { if (!cancelled) setLoadingMuscle(false) })
    return () => { cancelled = true }
  }, [timePeriod])

  const comparisonItems = comparisonData.filter((b) => b.sessionsCompleted > 0)
  const isWeeks = comparisonType === 'weeks'
  const volumeChartLabel = isWeeks ? 'Volume (kg)' : 'Weekly Avg (kg)'
  const xAxisAngleProps = isWeeks
    ? {}
    : { angle: -30, textAnchor: 'end' as const, interval: 0 }
  const chartMargin = isWeeks
    ? { top: 4, right: 8, left: 0, bottom: 4 }
    : { top: 4, right: 8, left: 0, bottom: 40 }

  return (
    <div className="space-y-6">
      {/* Muscle Group Volume */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Muscle Group Volume</h2>
          <p className="text-xs text-gray-500 mt-0.5">Average sets per week in selected period</p>
        </CardHeader>
        <CardBody>
          {loadingMuscle ? (
            <div className="text-center py-8 text-sm text-gray-500">Loading...</div>
          ) : muscleVolumeData.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">No data in this period.</div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(180, muscleVolumeData.length * 34)}
            >
              <BarChart
                data={muscleVolumeData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 80, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="muscleGroup"
                  tick={{ fontSize: 11 }}
                  width={76}
                  tickFormatter={capitalize}
                />
                <Tooltip
                  formatter={(val: number) => [`${val} sets/wk`, 'Avg Sets/Week']}
                  labelFormatter={capitalize}
                />
                <Bar
                  dataKey="avgSetsPerWeek"
                  name="Avg Sets/Week"
                  fill="#0ea5e9"
                  radius={[0, 3, 3, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      {/* Training Comparison */}
      <Card>
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
            <div className="text-center py-8 text-sm text-gray-500">No data to compare yet.</div>
          ) : (
            <div className="space-y-8">
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
                    <Bar dataKey="weeklyAvgVolumeKg" name={volumeChartLabel} radius={[3, 3, 0, 0]}>
                      {comparisonItems.map((b) => (
                        <Cell key={b.id} fill={statusColour(b.status)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

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

              <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#22c55e' }} />
                  Active
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#3b82f6' }} />
                  Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#94a3b8' }} />
                  Planned
                </span>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Recent Workouts */}
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
