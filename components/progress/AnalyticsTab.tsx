'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { MEV } from '@/lib/volumeLandmarks'

interface ReadinessData {
  trafficLight: 'green' | 'amber' | 'red'
  rpeTrend: { recent: number | null; prior: number | null; oldest: number | null; delta: number | null }
  adherence: { completed: number; planned: number; percentage: number | null }
  recoveryCredit: boolean
  progressionTrend: 'improving' | 'stable' | 'stalling' | 'declining' | null
  highlights: { exerciseName: string; change: string; direction: 'up' | 'down' }[]
  wellness: { average: number | null; count: number }
  explanation: string
}

interface MuscleVolumeItem {
  muscleGroup: string
  avgSetsPerWeek: number
  totalSets: number
}

const TRAFFIC_LIGHT_CONFIG = {
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    dot: 'bg-green-500',
    label: 'Ready to Train',
    textColor: 'text-green-700',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    label: 'Some Fatigue Detected',
    textColor: 'text-amber-700',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
    label: 'High Fatigue — Consider Deload',
    textColor: 'text-red-700',
  },
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function AnalyticsTab({ timePeriod, clientId }: { timePeriod: string; clientId?: string }) {
  const { data: session } = useSession()
  const isBasic = false // single tier — re-enable if tiering reintroduced: (session?.user as any)?.tier === 'BASIC'

  const [readiness, setReadiness] = useState<ReadinessData | null | undefined>(undefined)
  const [loadingReadiness, setLoadingReadiness] = useState(true)
  const [muscleVolumeData, setMuscleVolumeData] = useState<MuscleVolumeItem[]>([])
  const [loadingMuscle, setLoadingMuscle] = useState(true)
  const [stagnatingExercises, setStagnatingExercises] = useState<Array<{ id: string; name: string; suggestedLoad?: number; isBodyweight: boolean }>>([])
  const [loadingStagnation, setLoadingStagnation] = useState(true)

  useEffect(() => {
    fetch(`/api/progress/readiness${clientId ? `?clientId=${clientId}` : ''}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setReadiness)
      .catch(console.error)
      .finally(() => setLoadingReadiness(false))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingMuscle(true)
    // Always use current phase for weak point analysis — cross-phase data is misleading here
    fetch(`/api/progress/muscle-volume?period=phase${clientId ? `&clientId=${clientId}` : ''}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (!cancelled) setMuscleVolumeData(data) })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoadingMuscle(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingStagnation(true)
    fetch(`/api/exercises/stagnation?all=true${clientId ? `&clientId=${clientId}` : ''}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Record<string, { stagnant: boolean; suggestedLoad?: number; isBodyweight: boolean; exerciseName?: string }>) => {
        if (cancelled) return
        const list = Object.entries(data)
          .filter(([, v]) => v.stagnant)
          .map(([id, v]) => ({ id, name: v.exerciseName ?? id, suggestedLoad: v.suggestedLoad, isBodyweight: v.isBodyweight }))
          .sort((a, b) => a.name.localeCompare(b.name))
        setStagnatingExercises(list)
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoadingStagnation(false) })
    return () => { cancelled = true }
  }, [])

  if (isBasic) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <span className="text-xl text-gray-400">🔒</span>
        </div>
        <span className="inline-block mb-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">Elite</span>
        <p className="text-base font-medium text-gray-700 mb-1">Deep Analytics</p>
        <p className="text-sm text-gray-500 max-w-xs">
          Weak point identification, training readiness, and fatigue indicators — available on the Elite plan.
        </p>
      </div>
    )
  }

  // Build weak point chart data: all MEV muscles with actual vs target
  const muscleMap = new Map(muscleVolumeData.map((d) => [d.muscleGroup, d.avgSetsPerWeek]))
  const weakPointChartData = Object.entries(MEV)
    .map(([muscle, mev]) => ({
      muscleGroup: muscle,
      avgSetsPerWeek: muscleMap.get(muscle) ?? 0,
      mev,
      aboveMEV: (muscleMap.get(muscle) ?? 0) >= mev,
    }))
    .sort((a, b) => {
      // Weak points first, then by sets ascending
      if (a.aboveMEV !== b.aboveMEV) return a.aboveMEV ? 1 : -1
      return a.avgSetsPerWeek - b.avgSetsPerWeek
    })

  const weakPoints = weakPointChartData.filter((d) => !d.aboveMEV && d.avgSetsPerWeek > 0)
  const untrainedMuscles = weakPointChartData.filter((d) => d.avgSetsPerWeek === 0)

  const tl = readiness ? TRAFFIC_LIGHT_CONFIG[readiness.trafficLight] : null

  return (
    <div className="space-y-6">
      {/* Training Readiness */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Training Readiness</h2>
        </CardHeader>
        <CardBody>
          {loadingReadiness ? (
            <div className="text-center py-8 text-sm text-gray-500">Loading...</div>
          ) : readiness == null ? (
            <div className="text-center py-8 text-sm text-gray-500">
              Not enough data yet. Log more workouts with RPE ratings to see your readiness score.
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={`flex items-center gap-4 rounded-lg border p-4 ${tl!.bg} ${tl!.border}`}
              >
                <div className={`w-5 h-5 rounded-full shrink-0 ${tl!.dot}`} />
                <div>
                  <p className={`font-semibold ${tl!.textColor}`}>{tl!.label}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{readiness.explanation}</p>
                </div>
              </div>

              <div className="space-y-2">
                {/* RPE row */}
                <div className="grid grid-cols-2 bg-gray-50 rounded-lg divide-x divide-gray-200">
                  <div className="text-center px-3 py-3">
                    <p className="text-xs text-gray-500 mb-1">Recent RPE</p>
                    <p className="text-xl font-bold text-gray-900">
                      {readiness.rpeTrend.recent != null ? readiness.rpeTrend.recent.toFixed(1) : '—'}
                    </p>
                    <p className="text-xs text-gray-400">past 2 wks</p>
                  </div>
                  <div className="text-center px-3 py-3">
                    <p className="text-xs text-gray-500 mb-1">Prior RPE</p>
                    <p className="text-xl font-bold text-gray-900">
                      {readiness.rpeTrend.prior != null ? readiness.rpeTrend.prior.toFixed(1) : '—'}
                    </p>
                    <p className="text-xs text-gray-400">prior 2 wks</p>
                  </div>
                </div>

                {/* Adherence row */}
                <div className="flex bg-gray-50 rounded-lg px-4 py-3 items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Adherence</p>
                    <p className="text-xs text-gray-400">{readiness.adherence.completed}/{readiness.adherence.planned} completed weeks</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {readiness.adherence.percentage != null ? `${readiness.adherence.percentage}%` : '—'}
                  </p>
                </div>

                {/* Lifts row */}
                <div className="flex bg-gray-50 rounded-lg px-4 py-3 items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Lift Progression</p>
                    <p className="text-xs text-gray-400 capitalize">{readiness.progressionTrend ?? 'no data'}</p>
                  </div>
                  <p className={`text-xl font-bold ${
                    readiness.progressionTrend === 'improving' ? 'text-green-600' :
                    readiness.progressionTrend === 'declining' ? 'text-red-500' :
                    readiness.progressionTrend === 'stalling' ? 'text-amber-500' :
                    'text-gray-900'
                  }`}>
                    {readiness.progressionTrend === 'improving' ? '↑' :
                     readiness.progressionTrend === 'declining' ? '↓' :
                     readiness.progressionTrend === 'stalling' ? '→' :
                     readiness.progressionTrend === 'stable' ? '→' : '—'}
                  </p>
                </div>

                {/* Wellness row (if data exists) */}
                {readiness.wellness.average != null && (
                  <div className="flex bg-gray-50 rounded-lg px-4 py-3 items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Pre-Workout Wellness</p>
                      <p className="text-xs text-gray-400">{readiness.wellness.count} check-in{readiness.wellness.count !== 1 ? 's' : ''} (past 4 wks)</p>
                    </div>
                    <p className={`text-xl font-bold ${
                      readiness.wellness.average >= 4 ? 'text-green-600' :
                      readiness.wellness.average >= 3 ? 'text-gray-900' :
                      readiness.wellness.average >= 2 ? 'text-amber-500' :
                      'text-red-500'
                    }`}>
                      {readiness.wellness.average.toFixed(1)}<span className="text-sm text-gray-400 font-normal">/5</span>
                    </p>
                  </div>
                )}
              </div>

              {readiness.highlights.length > 0 && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-700 mb-2">Recent Highlights</p>
                  <div className="space-y-1">
                    {readiness.highlights.map((h, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <p className="text-xs text-green-800 truncate">{h.exerciseName}</p>
                        <span className={`text-xs font-semibold ml-2 flex-shrink-0 ${h.direction === 'up' ? 'text-green-700' : 'text-red-600'}`}>
                          {h.direction === 'up' ? '↑' : '↓'} {h.change}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Stagnating Exercises */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Progression Stalls</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Exercises with flat or declining 1RM estimates over the last 3 sessions
          </p>
        </CardHeader>
        <CardBody>
          {loadingStagnation ? (
            <div className="text-center py-8 text-sm text-gray-500">Loading...</div>
          ) : stagnatingExercises.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No stalls detected — all tracked exercises are progressing.
            </p>
          ) : (
            <div className="space-y-2">
              {stagnatingExercises.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-start justify-between gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{ex.name}</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        {ex.isBodyweight
                          ? 'No rep improvement in last 3 sessions — consider reducing reps slightly to focus on form.'
                          : ex.suggestedLoad
                          ? `Consider dropping to ~${ex.suggestedLoad}kg for a few weeks to focus on form and execution.`
                          : 'No 1RM progress in last 3 sessions.'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-1">
                Tip: a short deload or technique focus often breaks a plateau faster than grinding the same weight.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Weak Point Identification */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Weak Point Analysis</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Avg sets/week vs Minimum Effective Volume (MEV) — current phase
          </p>
        </CardHeader>
        <CardBody>
          {loadingMuscle ? (
            <div className="text-center py-8 text-sm text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer
                width="100%"
                height={weakPointChartData.length * 36}
              >
                <BarChart
                  data={weakPointChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 40, left: 0, bottom: 4 }}
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
                    formatter={(val: number, name: string, item: any) => {
                      const mev = item?.payload?.mev ?? '—'
                      return [`${val} sets/wk (MEV: ${mev})`, 'Avg Sets']
                    }}
                    labelFormatter={capitalize}
                  />
                  <Bar dataKey="avgSetsPerWeek" radius={[0, 3, 3, 0]}>
                    {weakPointChartData.map((item) => (
                      <Cell
                        key={item.muscleGroup}
                        fill={
                          item.avgSetsPerWeek === 0
                            ? '#e5e7eb'
                            : item.aboveMEV
                            ? '#22c55e'
                            : '#ef4444'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block bg-green-500" />
                  At or above MEV
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block bg-red-500" />
                  Below MEV
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block bg-gray-200" />
                  Not trained
                </span>
              </div>

              {weakPoints.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">Weak Points</p>
                  <p className="text-xs text-red-600">
                    {weakPoints.map((d) => capitalize(d.muscleGroup)).join(', ')} — consider
                    adding more volume for these muscle groups.
                  </p>
                </div>
              )}

              {untrainedMuscles.length > 0 && (
                <p className="text-xs text-gray-400">
                  Not trained in this period:{' '}
                  {untrainedMuscles.map((d) => capitalize(d.muscleGroup)).join(', ')}
                </p>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
