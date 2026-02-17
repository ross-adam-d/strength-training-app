import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

// Cache dashboard data for 30 seconds
export const revalidate = 30

const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
  return `${Math.round(kg).toLocaleString()}kg`
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const now = new Date()

  // Stage 1: independent queries in parallel
  const [blockCount, activeBlock, recentWorkoutLogs] = await Promise.all([
    prisma.macrocycle.count({
      where: { userId: session.user.id },
    }),
    prisma.macrocycle.findFirst({
      where: { userId: session.user.id, status: 'active' },
      orderBy: { startDate: 'desc' },
      select: { id: true, name: true },
    }),
    prisma.workoutLog.findMany({
      where: { userId: session.user.id },
      orderBy: { completedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        completedAt: true,
        duration: true,
        workout: { select: { name: true } },
        exerciseLogs: {
          select: { exerciseId: true },
          distinct: ['exerciseId'],
        },
      },
    }),
  ])

  // Stage 2: depends on activeBlock — find current microcycle with workouts and phase info
  let currentMicro: {
    id: string
    weekNumber: number
    mesocycle: {
      id: string
      name: string
      focus: string | null
      microcycles: { id: string }[]
    }
    workouts: {
      id: string
      name: string
      dayOfWeek: number | null
      estimatedDuration: number | null
      workoutLogs: { id: string }[]
    }[]
  } | null = null

  if (activeBlock) {
    currentMicro = await prisma.microcycle.findFirst({
      where: {
        startDate: { lte: now },
        endDate: { gt: now },
        mesocycle: { macrocycleId: activeBlock.id },
      },
      select: {
        id: true,
        weekNumber: true,
        mesocycle: {
          select: {
            id: true,
            name: true,
            focus: true,
            microcycles: {
              select: { id: true },
              orderBy: { weekNumber: 'asc' },
            },
          },
        },
        workouts: {
          select: {
            id: true,
            name: true,
            dayOfWeek: true,
            estimatedDuration: true,
            workoutLogs: {
              take: 1,
              orderBy: { completedAt: 'desc' },
              select: { id: true },
            },
          },
        },
      },
    })
  }

  // Phase stats — scoped to current mesocycle
  let phaseStats = { sessions: 0, totalMinutes: 0, totalVolumeKg: 0 }
  if (currentMicro) {
    const phaseLogs = await prisma.workoutLog.findMany({
      where: {
        userId: session.user.id,
        workout: {
          microcycle: { mesocycleId: currentMicro.mesocycle.id },
        },
      },
      select: {
        duration: true,
        exerciseLogs: {
          where: { skipped: false },
          select: { weight: true, reps: true, repsLeft: true, repsRight: true },
        },
      },
    })

    phaseStats.sessions = phaseLogs.length
    phaseStats.totalMinutes = phaseLogs.reduce((sum, log) => sum + (log.duration || 0), 0)
    phaseStats.totalVolumeKg = phaseLogs.reduce((sum, log) =>
      sum + log.exerciseLogs.reduce((exSum, ex) => {
        const reps = ex.reps || ((ex.repsLeft || 0) + (ex.repsRight || 0))
        return exSum + ex.weight * reps
      }, 0)
    , 0)
  }

  // Sort workouts: days 0–6 in order, null (unscheduled) last
  const sortedWorkouts = currentMicro
    ? [...currentMicro.workouts].sort((a, b) => {
        if (a.dayOfWeek === null) return 1
        if (b.dayOfWeek === null) return -1
        return a.dayOfWeek - b.dayOfWeek
      })
    : []

  // Next uncompleted workout (first in sorted order with no log)
  const nextWorkoutId = sortedWorkouts.find((w) => w.workoutLogs.length === 0)?.id ?? null

  const totalWeeks = currentMicro?.mesocycle.microcycles.length ?? 0
  const weekNumber = currentMicro?.weekNumber ?? 0
  const progressPercent = totalWeeks > 0 ? Math.round((weekNumber / totalWeeks) * 100) : 0

  return (
    <div className="space-y-6">

      {/* No training blocks exist at all */}
      {blockCount === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 mb-4">No training block yet. Create one to get started.</p>
          <Link
            href="/macrocycles/setup"
            className="inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium"
          >
            Create Training Block
          </Link>
        </div>
      )}

      {/* Stats row — only shown when there's an active phase */}
      {currentMicro && (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <StatCard
            label="Sessions"
            value={phaseStats.sessions.toString()}
            sub="this phase"
          />
          <StatCard
            label="Time"
            value={`${(phaseStats.totalMinutes / 60).toFixed(1)}h`}
            sub="this phase"
          />
          <StatCard
            label="Volume"
            value={formatVolume(phaseStats.totalVolumeKg)}
            sub="this phase"
          />
        </div>
      )}

      {/* Current week */}
      {currentMicro && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Phase header with progress — clickable link to phase details */}
          <Link href={`/mesocycles/${currentMicro.mesocycle.id}`} className="block px-6 py-4 border-b hover:bg-gray-50 transition">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-gray-900">{currentMicro.mesocycle.name}</h2>
                <p className="text-sm text-gray-500">Week {weekNumber} of {totalWeeks}</p>
              </div>
              <span className="text-sm font-medium text-gray-500">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </Link>

          {/* Workout rows */}
          <div className="divide-y">
            {sortedWorkouts.length === 0 && (
              <p className="px-6 py-6 text-sm text-gray-500 text-center">No workouts scheduled this week.</p>
            )}
            {sortedWorkouts.map((workout) => {
              const isCompleted = workout.workoutLogs.length > 0
              const isNext = workout.id === nextWorkoutId
              const logId = workout.workoutLogs[0]?.id

              return (
                <div
                  key={workout.id}
                  className={`flex items-center justify-between px-6 py-4 ${
                    isNext ? 'ring-2 ring-inset ring-primary-500' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className={`font-medium truncate ${isCompleted ? 'text-gray-500' : 'text-gray-900'}`}>
                        {workout.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {workout.dayOfWeek !== null
                        ? DAY_NAMES_FULL[workout.dayOfWeek]
                        : 'Unscheduled'}
                      {workout.estimatedDuration && ` · ${workout.estimatedDuration} min`}
                    </p>
                  </div>

                  {isCompleted ? (
                    <Link
                      href={`/workout-logs/${logId}`}
                      className="ml-3 flex-shrink-0 px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition"
                    >
                      View
                    </Link>
                  ) : (
                    <Link
                      href={`/workouts/${workout.id}/log`}
                      className={`ml-3 flex-shrink-0 px-4 py-1.5 text-sm rounded-md font-medium transition ${
                        isNext
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Start
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent workouts */}
      {recentWorkoutLogs.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Workouts</h2>
          <div className="space-y-3">
            {recentWorkoutLogs.map((log) => (
              <Link
                key={log.id}
                href={`/workout-logs/${log.id}`}
                className="block p-3 border rounded-md hover:bg-gray-50 transition"
              >
                <h3 className="font-medium">{log.workout?.name ?? 'Manual Workout'}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(log.completedAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {log.exerciseLogs.length} exercises{log.duration ? ` · ${log.duration} min` : ''}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
