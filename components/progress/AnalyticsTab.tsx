'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { MEV } from '@/lib/volumeLandmarks'

interface ReadinessData {
  trafficLight: 'green' | 'amber' | 'red'
  rpeTrend: { recent: number | null; prior: number | null; delta: number | null }
  adherence: { completed: number; planned: number; percentage: number | null }
  recoveryCredit: boolean
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

export default function AnalyticsTab({ timePeriod }: { timePeriod: string }) {
  const { data: session } = useSession()
  const isBasic = (session?.user as any)?.tier === 'BASIC'

  const [readiness, setReadiness] = useState<ReadinessData | null | undefined>(undefined)
  const [loadingReadiness, setLoadingReadiness] = useState(true)
  const [muscleVolumeData, setMuscleVolumeData] = useState<MuscleVolumeItem[]>([])
  const [loadingMuscle, setLoadingMuscle] = useState(true)

  useEffect(() => {
    fetch('/api/progress/readiness')
      .then((r) => (r.ok ? r.json() : null))
      .then(setReadiness)
      .catch(console.error)
      .finally(() => setLoadingReadiness(false))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingMuscle(true)
    fetch(`/api/progress/muscle-volume?period=${timePeriod}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (!cancelled) setMuscleVolumeData(data) })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoadingMuscle(false) })
    return () => { cancelled = true }
  }, [timePeriod])

  if (isBasic) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <span className="text-xl text-gray-400">🔒</span>
        </div>
        <p className="text-base font-medium text-gray-700 mb-1">Premiere Feature</p>
        <p className="text-sm text-gray-500 max-w-xs">
          Deep Analytics — weak point identification, training readiness, and fatigue indicators —
          is available on the Premiere plan.
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
  const showFatigueCallout =
    readiness?.rpeTrend?.delta != null && readiness.rpeTrend.delta >= 0.5

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

              <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Recent RPE</p>
                  <p className="text-lg font-bold text-gray-900">
                    {readiness.rpeTrend.recent != null
                      ? readiness.rpeTrend.recent.toFixed(1)
                      : '—'}
                  </p>
                  <p className="text-xs text-gray-400">past 2 weeks</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Prior RPE</p>
                  <p className="text-lg font-bold text-gray-900">
                    {readiness.rpeTrend.prior != null
                      ? readiness.rpeTrend.prior.toFixed(1)
                      : '—'}
                  </p>
                  <p className="text-xs text-gray-400">prior 2 weeks</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Adherence</p>
                  <p className="text-lg font-bold text-gray-900">
                    {readiness.adherence.percentage != null
                      ? `${readiness.adherence.percentage}%`
                      : '—'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {readiness.adherence.completed}/{readiness.adherence.planned} workouts
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Fatigue Callout — only shown when triggered */}
      {showFatigueCallout && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">RPE Creep Detected</p>
          <p className="text-sm text-amber-700">
            Your avg RPE has risen from {readiness!.rpeTrend.prior!.toFixed(1)} to{' '}
            {readiness!.rpeTrend.recent!.toFixed(1)} (
            {readiness!.rpeTrend.delta! > 0 ? '+' : ''}
            {readiness!.rpeTrend.delta!.toFixed(1)}) over the past 2 weeks. This signals
            accumulating fatigue — consider reducing intensity or scheduling a deload week.
          </p>
        </div>
      )}

      {/* Weak Point Identification */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Weak Point Analysis</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Avg sets/week vs Minimum Effective Volume (MEV) in selected period
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
                  margin={{ top: 4, right: 40, left: 80, bottom: 4 }}
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
