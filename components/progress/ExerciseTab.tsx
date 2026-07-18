'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { formatWeight, weightUnit, kgToDisplay } from '@/lib/units'
import { effectiveLoad, resolveBodyweight, liftType, type LiftType } from '@/lib/effectiveLoad'
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
  isBodyweight: boolean
  isTimed: boolean
}

interface ExerciseLog {
  id: string
  setNumber: number
  reps: number
  repsLeft: number | null
  repsRight: number | null
  weight: number
  duration: number | null
  skipped: boolean
  exerciseRpe: number | null
  exercise: { isBodyweight: boolean; isTimed: boolean }
  workoutLog: { completedAt: string; bodyweight: number | null }
}

interface PrItem {
  exerciseId: string
  exerciseName: string
  type: LiftType
  est1RM: number
  est5RM: number
  est10RM: number
  bestReps: number
  bestHold: number
  bestSessionTUT: number
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
  if (period === '1w') { now.setDate(now.getDate() - 7); return now.toISOString() }
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

function formatHold(seconds: number): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
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

export default function ExerciseTab({ timePeriod, clientId }: { timePeriod: string; clientId?: string }) {
  const { data: session } = useSession()
  const isBasic = false // single tier — re-enable if tiering reintroduced: (session?.user as any)?.tier === 'BASIC'
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
  const [profileWeight, setProfileWeight] = useState<number | null>(null)
  const [loadingExercises, setLoadingExercises] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(false)
  // Bodyweight exercises can be viewed as reps (default) or as derived load/1RM/volume
  const [bwView, setBwView] = useState<'reps' | 'load'>('reps')

  // Fetch PR data on mount
  useEffect(() => {
    fetch(`/api/progress/prs${clientId ? `?clientId=${clientId}` : ''}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setPrData)
      .catch(console.error)
      .finally(() => setLoadingPrs(false))
  }, [])

  // Fetch exercise list for chart selector
  useEffect(() => {
    fetch(`/api/exercises?logged=true${clientId ? `&clientId=${clientId}` : ''}`)
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
      const clientParam = clientId ? `&clientId=${clientId}` : ''
      const url = since
        ? `/api/exercises/${exerciseId}/logs?since=${encodeURIComponent(since)}${clientParam}`
        : `/api/exercises/${exerciseId}/logs${clientId ? `?clientId=${clientId}` : ''}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        // New shape: { logs, profileWeight }; tolerate the old array shape too
        if (Array.isArray(data)) {
          setExerciseLogs(data)
          setProfileWeight(null)
        } else {
          setExerciseLogs(data.logs ?? [])
          setProfileWeight(data.profileWeight ?? null)
        }
      }
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

  const selectedMeta = exercises.find((e) => e.id === selectedExercise)
  const selType: LiftType = selectedMeta
    ? liftType(selectedMeta.isBodyweight, selectedMeta.isTimed)
    : 'load'

  // Reset bodyweight view to reps when switching exercises
  useEffect(() => { setBwView('reps') }, [selectedExercise])

  // Split PRs by type — loaded lifts keep the rich 1RM table; bodyweight & timed
  // get their own natural metrics (reps / hold).
  const loadedPrs = prData
    .filter((i) => i.type === 'load' && i.exerciseName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0
      if (sortKey === 'exerciseName') cmp = a.exerciseName.localeCompare(b.exerciseName)
      else if (sortKey === 'est1RM') cmp = a.est1RM - b.est1RM
      else cmp = new Date(a.lastLoggedAt).getTime() - new Date(b.lastLoggedAt).getTime()
      return sortDir === 'asc' ? cmp : -cmp
    })

  const bwPrs = prData
    .filter((i) => i.type === 'bodyweight' && i.exerciseName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.bestReps - a.bestReps)
  const timedPrs = prData
    .filter((i) => i.type === 'timed' && i.exerciseName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.bestHold - a.bestHold)

  const displayedLoaded = isBasic ? loadedPrs.slice(0, 5) : loadedPrs

  // ── Chart data helpers ──────────────────────────────────────────────────
  const effReps = (log: ExerciseLog) => log.reps || ((log.repsLeft ?? 0) + (log.repsRight ?? 0))
  const loadOf = (log: ExerciseLog) =>
    effectiveLoad(
      log.weight,
      log.exercise?.isBodyweight ?? false,
      resolveBodyweight(log.workoutLog.bodyweight, profileWeight)
    )

  // Load / 1RM / volume — used for loaded lifts and the bodyweight "load" view
  const showLoadCharts = selType === 'load' || (selType === 'bodyweight' && bwView === 'load')

  const weightProgressData = showLoadCharts
    ? exerciseLogs.reduce(
        (acc: { date: string; maxWeight: number; estimated1RM: number }[], log) => {
          const load = loadOf(log)
          if (load == null) return acc
          const date = formatDate(log.workoutLog.completedAt)
          const est1RM = calculate1RM(load, effReps(log))
          const existing = acc.find((item) => item.date === date)
          if (existing) {
            if (load > existing.maxWeight) {
              existing.maxWeight = Math.round(kgToDisplay(load, unitPref) * 10) / 10
              existing.estimated1RM = Math.round(kgToDisplay(est1RM, unitPref))
            }
          } else {
            acc.push({
              date,
              maxWeight: Math.round(kgToDisplay(load, unitPref) * 10) / 10,
              estimated1RM: Math.round(kgToDisplay(est1RM, unitPref)),
            })
          }
          return acc
        },
        []
      )
    : []

  const volumeData = showLoadCharts
    ? exerciseLogs.reduce(
        (acc: { date: string; volume: number; sets: number }[], log) => {
          const load = loadOf(log)
          if (load == null) return acc
          const date = formatDate(log.workoutLog.completedAt)
          const existing = acc.find((item) => item.date === date)
          const vol = kgToDisplay(load * effReps(log), unitPref)
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
    : []

  // Reps view (bodyweight) — total reps + best-set reps per session
  const repsData = selType === 'bodyweight' && bwView === 'reps'
    ? exerciseLogs.reduce(
        (acc: { date: string; totalReps: number; bestSet: number }[], log) => {
          if (log.skipped) return acc
          const date = formatDate(log.workoutLog.completedAt)
          const r = effReps(log)
          const existing = acc.find((item) => item.date === date)
          if (existing) {
            existing.totalReps += r
            if (r > existing.bestSet) existing.bestSet = r
          } else {
            acc.push({ date, totalReps: r, bestSet: r })
          }
          return acc
        },
        []
      )
    : []

  // Timed — longest hold + total time under tension per session
  const timedData = selType === 'timed'
    ? exerciseLogs.reduce(
        (acc: { date: string; longestHold: number; totalTUT: number }[], log) => {
          if (log.skipped) return acc
          const date = formatDate(log.workoutLog.completedAt)
          const d = log.duration ?? 0
          const existing = acc.find((item) => item.date === date)
          if (existing) {
            existing.totalTUT += d
            if (d > existing.longestHold) existing.longestHold = d
          } else {
            acc.push({ date, longestHold: d, totalTUT: d })
          }
          return acc
        },
        []
      )
    : []

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

  const hasChartData =
    weightProgressData.length > 0 || repsData.length > 0 || timedData.length > 0

  return (
    <div className="space-y-6">
      {/* PR Table — loaded lifts */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Personal Records</h2>
              {isBasic && loadedPrs.length > 5 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Showing top 5 of {loadedPrs.length} — Elite for full table
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
          ) : loadedPrs.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No weighted lifts logged yet.
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
                  {displayedLoaded.map((item) => (
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
              {isBasic && loadedPrs.length > 5 && (
                <p className="text-xs text-gray-400 text-center mt-4 pb-1">
                  + {loadedPrs.length - 5} more exercises — upgrade to Elite to see all
                </p>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Bodyweight & Timed bests */}
      {!isBasic && (bwPrs.length > 0 || timedPrs.length > 0) && (
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Bodyweight &amp; Timed Bests</h2>
            <p className="text-xs text-gray-400 mt-0.5">Best reps and longest holds per exercise</p>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm min-w-[360px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-3">Exercise</th>
                    <th className="text-right text-xs font-medium text-gray-500 pb-2 px-2">Best</th>
                    <th className="text-right text-xs font-medium text-gray-500 pb-2 px-2">Detail</th>
                    <th className="text-right text-xs font-medium text-gray-500 pb-2 pl-2">Last</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bwPrs.map((item) => (
                    <tr key={item.exerciseId}>
                      <td className="py-2.5 pr-3 font-medium text-gray-900">{item.exerciseName}</td>
                      <td className="py-2.5 px-2 text-right text-primary-600 font-semibold">
                        {item.bestReps} reps
                      </td>
                      <td className="py-2.5 px-2 text-right text-gray-500 text-xs">
                        {item.est1RM > 0 ? `~${formatWeight(item.est1RM, unitPref)} 1RM` : '—'}
                      </td>
                      <td className="py-2.5 pl-2 text-right text-gray-400 text-xs">
                        {formatLastLogged(item.lastLoggedAt)}
                      </td>
                    </tr>
                  ))}
                  {timedPrs.map((item) => (
                    <tr key={item.exerciseId}>
                      <td className="py-2.5 pr-3 font-medium text-gray-900">{item.exerciseName}</td>
                      <td className="py-2.5 px-2 text-right text-primary-600 font-semibold">
                        {formatHold(item.bestHold)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-gray-500 text-xs">
                        TUT {formatHold(item.bestSessionTUT)}
                      </td>
                      <td className="py-2.5 pl-2 text-right text-gray-400 text-xs">
                        {formatLastLogged(item.lastLoggedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

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
            {/* Reps ⇄ Load toggle for bodyweight exercises */}
            {selType === 'bodyweight' && (
              <div className="flex gap-1 mt-3">
                {(['reps', 'load'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setBwView(v)}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      bwView === v
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'text-gray-500 hover:text-gray-700 border border-gray-200'
                    }`}
                  >
                    {v === 'reps' ? 'Reps' : 'Load & 1RM'}
                  </button>
                ))}
              </div>
            )}
          </CardHeader>
          <CardBody>
            {loadingLogs ? (
              <div className="text-center py-8 text-sm text-gray-500">Loading...</div>
            ) : !hasChartData ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                {selType === 'bodyweight' && bwView === 'load'
                  ? 'No bodyweight recorded for these sessions — log your bodyweight to see load & 1RM.'
                  : 'No data for this exercise in the selected period.'}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Timed exercise charts */}
                {selType === 'timed' && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-3">Longest Hold (per session)</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={timedData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} width={40} tickFormatter={(v: number) => formatHold(v)} />
                          <Tooltip formatter={(val: number) => [formatHold(val), 'Longest hold']} />
                          <Line type="monotone" dataKey="longestHold" stroke="#d96b00" name="Longest hold" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-3">Total Time Under Tension (per session)</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={timedData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} width={40} tickFormatter={(v: number) => formatHold(v)} />
                          <Tooltip formatter={(val: number) => [formatHold(val), 'Total TUT']} />
                          <Bar dataKey="totalTUT" fill="#f5a855" name="Total TUT" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}

                {/* Bodyweight reps view */}
                {selType === 'bodyweight' && bwView === 'reps' && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-3">Reps (per session)</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={repsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} width={40} />
                        <Tooltip />
                        <Bar dataKey="totalReps" fill="#d96b00" name="Total reps" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="bestSet" fill="#f5a855" name="Best set" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Load / 1RM / volume charts (loaded lifts + bodyweight load view) */}
                {showLoadCharts && weightProgressData.length > 0 && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-3">
                        {selType === 'bodyweight' ? 'Effective Load & Estimated 1RM' : 'Max Weight & Estimated 1RM'} ({unit})
                      </p>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={weightProgressData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} width={40} />
                          <Tooltip />
                          <Bar dataKey="maxWeight" fill="#d96b00" name={`Max Weight (${unit})`} radius={[3, 3, 0, 0]} />
                          <Bar dataKey="estimated1RM" fill="#f5a855" name={`Est. 1RM (${unit})`} radius={[3, 3, 0, 0]} />
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
                          <Bar dataKey="volume" fill="#d96b00" name={`Volume (${unit})`} radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}

                {/* RPE chart — shared across all types */}
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
