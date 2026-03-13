'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { formatWeight, weightUnit, kgToDisplay } from '@/lib/units'
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
  ResponsiveContainer,
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
  workoutLog: { completedAt: string }
}

interface PrItem {
  exerciseId: string
  exerciseName: string
  est1RM: number
  est5RM: number
  est10RM: number
  lastLoggedAt: string
}

type SortKey = 'exerciseName' | 'est1RM' | 'lastLoggedAt'

const RPE_LABELS: Record<number, string> = {
  1: 'Too Easy',
  2: 'Easy',
  3: 'Just Right',
  4: 'Hard',
  5: 'Too Much',
}

function getSinceDate(period: string): string | null {
  const now = new Date()
  if (period === '4w') { now.setDate(now.getDate() - 28); return now.toISOString() }
  if (period === '3m') { now.setMonth(now.getMonth() - 3); return now.toISOString() }
  return null
}

function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatLastLogged(isoString: string) {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  })
}

function SortButton({
  label,
  sortKey,
  activeKey,
  dir,
  onClick,
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  dir: 'asc' | 'desc'
  onClick: (key: SortKey) => void
}) {
  const active = sortKey === activeKey
  return (
    <button
      onClick={() => onClick(sortKey)}
      className={`text-xs px-2 py-1 rounded transition-colors ${
        active
          ? 'bg-primary-100 text-primary-700 font-medium'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
      {active && <span className="ml-0.5">{dir === 'asc' ? ' ↑' : ' ↓'}</span>}
    </button>
  )
}

export default function ExerciseTab({ timePeriod }: { timePeriod: string }) {
  const { data: session } = useSession()
  const isBasic = (session?.user as any)?.tier === 'BASIC'
  const unitPref = (session?.user as any)?.unitPreference ?? 'metric'
  const unit = weightUnit(unitPref)

  // PR table state
  const [prData, setPrData] = useState<PrItem[]>([])
  const [loadingPrs, setLoadingPrs] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('est1RM')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Exercise chart state
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([])
  const [loadingExercises, setLoadingExercises] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(false)

  // Fetch PR data on mount
  useEffect(() => {
    fetch('/api/progress/prs')
      .then((r) => (r.ok ? r.json() : []))
      .then(setPrData)
      .catch(console.error)
      .finally(() => setLoadingPrs(false))
  }, [])

  // Fetch exercise list for chart selector
  useEffect(() => {
    fetch('/api/exercises?logged=true')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Exercise[]) => {
        setExercises(data)
        if (data.length > 0) setSelectedExercise(data[0].id)
      })
      .catch(console.error)
      .finally(() => setLoadingExercises(false))
  }, [])

  const fetchLogs = useCallback(async (exerciseId: string, period: string) => {
    if (!exerciseId) return
    setLoadingLogs(true)
    try {
      const since = getSinceDate(period)
      const url = since
        ? `/api/exercises/${exerciseId}/logs?since=${encodeURIComponent(since)}`
        : `/api/exercises/${exerciseId}/logs`
      const res = await fetch(url)
      if (res.ok) setExerciseLogs(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingLogs(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs(selectedExercise, timePeriod)
  }, [selectedExercise, timePeriod, fetchLogs])

  // Sort handler — toggle dir on same key, reset to desc on new key
  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  // Filter + sort PR data
  const filteredPrs = prData
    .filter((item) => item.exerciseName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0
      if (sortKey === 'exerciseName') {
        cmp = a.exerciseName.localeCompare(b.exerciseName)
      } else if (sortKey === 'est1RM') {
        cmp = a.est1RM - b.est1RM
      } else {
        cmp = new Date(a.lastLoggedAt).getTime() - new Date(b.lastLoggedAt).getTime()
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

  const displayedPrs = isBasic ? filteredPrs.slice(0, 5) : filteredPrs

  // Derived chart data
  const weightProgressData = exerciseLogs.reduce(
    (acc: { date: string; maxWeight: number; estimated1RM: number }[], log) => {
      const date = formatDate(log.workoutLog.completedAt)
      const est1RM = calculate1RM(log.weight, log.reps)
      const existing = acc.find((item) => item.date === date)
      if (existing) {
        if (log.weight > existing.maxWeight) {
          existing.maxWeight = Math.round(kgToDisplay(log.weight, unitPref) * 10) / 10
          existing.estimated1RM = Math.round(kgToDisplay(est1RM, unitPref))
        }
      } else {
        acc.push({
          date,
          maxWeight: Math.round(kgToDisplay(log.weight, unitPref) * 10) / 10,
          estimated1RM: Math.round(kgToDisplay(est1RM, unitPref)),
        })
      }
      return acc
    },
    []
  )

  const volumeData = exerciseLogs.reduce(
    (acc: { date: string; volume: number; sets: number }[], log) => {
      const date = formatDate(log.workoutLog.completedAt)
      const existing = acc.find((item) => item.date === date)
      const vol = kgToDisplay(log.weight * log.reps, unitPref)
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

  const validLogs = exerciseLogs.filter((l) => !l.skipped && l.weight > 0 && l.reps > 0)
  const sessionDates = [...new Set(validLogs.map((l) => l.workoutLog.completedAt.slice(0, 10)))]

  const performanceSummary = (() => {
    if (validLogs.length === 0 || sessionDates.length < 2) return null
    const firstDate = sessionDates[0]
    const lastDate = sessionDates[sessionDates.length - 1]
    const firstLogs = validLogs.filter((l) => l.workoutLog.completedAt.slice(0, 10) === firstDate)
    const lastLogs = validLogs.filter((l) => l.workoutLog.completedAt.slice(0, 10) === lastDate)
    const firstWeightKg = Math.max(...firstLogs.map((l) => l.weight))
    const lastWeightKg = Math.max(...lastLogs.map((l) => l.weight))
    const weightChange = firstWeightKg > 0 ? ((lastWeightKg - firstWeightKg) / firstWeightKg) * 100 : 0
    const firstBestLog = firstLogs.reduce((best, l) =>
      calculate1RM(l.weight, l.reps) > calculate1RM(best.weight, best.reps) ? l : best
    )
    const lastBestLog = lastLogs.reduce((best, l) =>
      calculate1RM(l.weight, l.reps) > calculate1RM(best.weight, best.reps) ? l : best
    )
    const first1RMKg = calculate1RM(firstBestLog.weight, firstBestLog.reps)
    const last1RMKg = calculate1RM(lastBestLog.weight, lastBestLog.reps)
    const rmChange = first1RMKg > 0 ? ((last1RMKg - first1RMKg) / first1RMKg) * 100 : 0
    const allTimeMaxWeightKg = Math.max(...validLogs.map((l) => l.weight))
    const isPR = lastWeightKg >= allTimeMaxWeightKg && lastWeightKg > firstWeightKg
    return {
      lastWeight: formatWeight(lastWeightKg, unitPref),
      last1RM: formatWeight(last1RMKg, unitPref),
      weightChange,
      rmChange,
      isPR,
      sessionCount: sessionDates.length,
    }
  })()

  return (
    <div className="space-y-6">
      {/* PR Table */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Personal Records</h2>
              {isBasic && prData.length > 5 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Showing top 5 of {prData.length} — Elite for full table
                </p>
              )}
            </div>
            {!isBasic && (
              <input
                type="text"
                placeholder="Search exercises..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-sm border border-gray-200 rounded-md px-3 py-1.5 w-44 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            )}
          </div>
          {!isBasic && (
            <div className="flex gap-1 mt-2 flex-wrap">
              <span className="text-xs text-gray-400 self-center mr-1">Sort:</span>
              <SortButton label="Exercise" sortKey="exerciseName" activeKey={sortKey} dir={sortDir} onClick={handleSort} />
              <SortButton label="1RM" sortKey="est1RM" activeKey={sortKey} dir={sortDir} onClick={handleSort} />
              <SortButton label="Last logged" sortKey="lastLoggedAt" activeKey={sortKey} dir={sortDir} onClick={handleSort} />
            </div>
          )}
        </CardHeader>
        <CardBody>
          {loadingPrs ? (
            <div className="text-center py-8 text-sm text-gray-500">Loading...</div>
          ) : prData.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No data yet. Complete a workout to see your personal records.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm min-w-[380px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-3">Exercise</th>
                    <th className="text-right text-xs font-medium text-gray-500 pb-2 px-2">1RM ({unit})</th>
                    <th className="text-right text-xs font-medium text-gray-500 pb-2 px-2">5RM ({unit})</th>
                    <th className="text-right text-xs font-medium text-gray-500 pb-2 px-2">10RM ({unit})</th>
                    <th className="text-right text-xs font-medium text-gray-500 pb-2 pl-2">Last</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayedPrs.map((item) => (
                    <tr key={item.exerciseId}>
                      <td className="py-2.5 pr-3 font-medium text-gray-900">{item.exerciseName}</td>
                      <td className="py-2.5 px-2 text-right text-primary-600 font-semibold">
                        {formatWeight(item.est1RM, unitPref)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-gray-600">{formatWeight(item.est5RM, unitPref)}</td>
                      <td className="py-2.5 px-2 text-right text-gray-600">{formatWeight(item.est10RM, unitPref)}</td>
                      <td className="py-2.5 pl-2 text-right text-gray-400 text-xs">
                        {formatLastLogged(item.lastLoggedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {isBasic && prData.length > 5 && (
                <p className="text-xs text-gray-400 text-center mt-4 pb-1">
                  + {prData.length - 5} more exercises — upgrade to Elite to see all
                </p>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Exercise Progress Charts — Elite only */}
      {isBasic ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center py-10 text-center">
              <span className="inline-block mb-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">Elite</span>
              <p className="text-sm font-medium text-gray-600 mb-1">Exercise Progression Charts</p>
              <p className="text-xs text-gray-400">
                Upgrade to Elite to see weight trends, volume, and RPE charts per exercise.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900 shrink-0">Exercise Progress</h2>
              <div className="flex-1 max-w-xs">
                {loadingExercises ? null : (
                  <Select
                    options={[
                      { value: '', label: 'Select exercise...' },
                      ...exercises.map((ex) => ({ value: ex.id, label: ex.name })),
                    ]}
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                  />
                )}
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
                {performanceSummary && (
                  <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-lg p-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Top Weight</p>
                      <p className="text-lg font-bold text-gray-900">
                        {performanceSummary.lastWeight} {unit}
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
                        {performanceSummary.last1RM} {unit}
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
                    Max Weight & Estimated 1RM ({unit})
                  </p>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={weightProgressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={40} />
                      <Tooltip />
                      <Bar
                        dataKey="maxWeight"
                        fill="#d96b00"
                        name={`Max Weight (${unit})`}
                        radius={[3, 3, 0, 0]}
                      />
                      <Bar
                        dataKey="estimated1RM"
                        fill="#f5a855"
                        name={`Est. 1RM (${unit})`}
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-3">Session Volume ({unit})</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={volumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={40} />
                      <Tooltip />
                      <Bar
                        dataKey="volume"
                        fill="#d96b00"
                        name={`Volume (${unit})`}
                        radius={[3, 3, 0, 0]}
                      />
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
      )}
    </div>
  )
}
