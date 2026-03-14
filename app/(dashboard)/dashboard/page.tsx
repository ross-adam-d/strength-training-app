import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { WelcomeChecklist } from '@/components/WelcomeChecklist'
import { ReleaseNotesDialog } from '@/components/ReleaseNotesDialog'
import { LocalDate } from '@/components/LocalDate'
import { getUnseenReleaseNotes } from '@/lib/releaseNotes'
import { syncCheckoutSession } from '@/lib/billing'
import { BillingSuccessRefresher } from '@/components/BillingSuccessRefresher'
import { StatsCarousel } from '@/components/StatsCarousel'

const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatVolume(kg: number, unitPref: string): string {
  if (unitPref === 'imperial') {
    const lbs = kg * 2.20462
    if (lbs >= 2000) return `${(lbs / 2000).toFixed(1)}t`
    return `${Math.round(lbs).toLocaleString()}lbs`
  }
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
  return `${Math.round(kg).toLocaleString()}kg`
}


export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; uid?: string; session_id?: string }>
}) {
  const { billing, uid, session_id } = await searchParams
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  const unitPref = (session.user as any).unitPreference ?? 'metric'

  // Wrong account: Stripe redirected to a browser logged in as a different user
  if (uid && uid !== session.user.id) {
    const callbackUrl = encodeURIComponent('/dashboard?billing=success')
    redirect(`/login?reason=wrong_account&callbackUrl=${callbackUrl}`)
  }

  // Sync subscription from Stripe immediately — webhook may not have fired yet
  if (billing === 'success' && session_id) {
    await syncCheckoutSession(session_id, session.user.id)
    redirect('/dashboard?billing=success')
  }

  const now = new Date()

  // Stage 1: independent queries in parallel
  const [blockCount, activeBlock, recentWorkoutLogs, userData, coachRelationship] = await Promise.all([
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
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastSeenReleaseId: true },
    }),
    prisma.coachClientRelationship.findFirst({
      where: { clientId: session.user.id, status: 'ACTIVE' },
      select: { coach: { select: { name: true } } },
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
      workoutLogs: { id: string; completedAt: Date; duration: number | null }[]
    }[]
  } | null = null

  const microSelect = {
    id: true,
    weekNumber: true,
    mesocycle: {
      select: {
        id: true,
        name: true,
        focus: true,
        microcycles: {
          select: { id: true },
          orderBy: { weekNumber: 'asc' as const },
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
          orderBy: { completedAt: 'desc' as const },
          select: { id: true, completedAt: true, duration: true },
        },
      },
    },
  }

  if (activeBlock) {
    // Prefer the earliest started week that still has incomplete workouts.
    // This keeps a missed workout visible even after the calendar has moved on.
    currentMicro = await prisma.microcycle.findFirst({
      where: {
        startDate: { lte: now },
        mesocycle: { macrocycleId: activeBlock.id },
        workouts: { some: { workoutLogs: { none: {} } } },
      },
      orderBy: { weekNumber: 'asc' },
      select: microSelect,
    })

    // Fall back to the current calendar week when all started weeks are complete
    if (!currentMicro) {
      currentMicro = await prisma.microcycle.findFirst({
        where: {
          startDate: { lte: now },
          endDate: { gt: now },
          mesocycle: { macrocycleId: activeBlock.id },
        },
        select: microSelect,
      })
    }

    // Final fallback: show the earliest upcoming microcycle that has workouts.
    // Handles coach-created plans where the first week starts in the future.
    if (!currentMicro) {
      currentMicro = await prisma.microcycle.findFirst({
        where: {
          startDate: { gt: now },
          mesocycle: { macrocycleId: activeBlock.id },
          workouts: { some: {} },
        },
        orderBy: { startDate: 'asc' },
        select: microSelect,
      })
    }
  }

  // Detect active block with no workouts built yet (coach hasn't set up exercises)
  let phaseHasNoWorkouts = false
  let blockPhaseInfo: { phaseCount: number; totalWeeks: number } | null = null
  if (activeBlock && !currentMicro) {
    const workoutCount = await prisma.workout.count({
      where: { microcycle: { mesocycle: { macrocycleId: activeBlock.id } } },
    })
    phaseHasNoWorkouts = workoutCount === 0
    if (phaseHasNoWorkouts) {
      const mesocycles = await prisma.mesocycle.findMany({
        where: { macrocycleId: activeBlock.id },
        select: { microcycles: { select: { id: true } } },
      })
      blockPhaseInfo = {
        phaseCount: mesocycles.length,
        totalWeeks: mesocycles.reduce((sum, m) => sum + m.microcycles.length, 0),
      }
    }
  }

  // Stat views for carousel — only computed when there's an active phase
  const LOG_SELECT = {
    duration: true,
    exerciseLogs: {
      where: { skipped: false },
      select: { weight: true, reps: true, repsLeft: true, repsRight: true },
    },
  } as const

  function sumLogs(logs: { duration: number | null; exerciseLogs: { weight: number; reps: number; repsLeft: number | null; repsRight: number | null }[] }[]) {
    const sessions = logs.length
    const totalMinutes = logs.reduce((s, l) => s + (l.duration ?? 0), 0)
    const totalVolumeKg = logs.reduce((s, l) =>
      s + l.exerciseLogs.reduce((es, ex) => {
        const reps = ex.reps || ((ex.repsLeft ?? 0) + (ex.repsRight ?? 0))
        return es + ex.weight * reps
      }, 0), 0)
    return { sessions, totalMinutes, totalVolumeKg }
  }

  let statViews: import('@/components/StatsCarousel').StatView[] = []

  if (currentMicro) {
    // Boundaries for the prior completed calendar week (Mon–Sun)
    const dayOfWeek = now.getDay() // 0 = Sun, 1 = Mon, …
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const startOfThisWeek = new Date(now)
    startOfThisWeek.setDate(now.getDate() - daysToMonday)
    startOfThisWeek.setHours(0, 0, 0, 0)
    const startOfLastWeek = new Date(startOfThisWeek)
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7)

    const [phaseLogs, weekLogs, lastWeekLogs] = await Promise.all([
      prisma.workoutLog.findMany({
        where: { userId: session.user.id, workout: { microcycle: { mesocycleId: currentMicro.mesocycle.id } } },
        select: LOG_SELECT,
      }),
      prisma.workoutLog.findMany({
        where: { userId: session.user.id, workout: { microcycleId: currentMicro.id } },
        select: LOG_SELECT,
      }),
      prisma.workoutLog.findMany({
        where: {
          userId: session.user.id,
          completedAt: { gte: startOfLastWeek, lt: startOfThisWeek },
        },
        select: LOG_SELECT,
      }),
    ])

    const phase = sumLogs(phaseLogs)
    const week = sumLogs(weekLogs)
    const lastWeek = sumLogs(lastWeekLogs)

    statViews = [
      {
        title: 'This Phase',
        sub: 'this phase',
        sessions: phase.sessions.toString(),
        time: `${(phase.totalMinutes / 60).toFixed(1)}h`,
        volume: formatVolume(phase.totalVolumeKg, unitPref),
      },
      {
        title: 'This Week',
        sub: 'this week',
        sessions: week.sessions.toString(),
        time: week.totalMinutes > 0 ? `${(week.totalMinutes / 60).toFixed(1)}h` : '0h',
        volume: formatVolume(week.totalVolumeKg, unitPref),
      },
      {
        title: 'Last Week',
        sub: 'last week',
        sessions: lastWeek.sessions.toString(),
        time: lastWeek.totalMinutes > 0 ? `${(lastWeek.totalMinutes / 60).toFixed(1)}h` : '0h',
        volume: formatVolume(lastWeek.totalVolumeKg, unitPref),
      },
    ]
  }

  const unseenNotes = getUnseenReleaseNotes(userData?.lastSeenReleaseId ?? null)

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

      {/* Billing return banners */}
      {billing === 'success' && (
        <>
          <BillingSuccessRefresher />
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
            <span className="font-semibold">Subscription activated!</span> Welcome aboard — your plan is now active.
          </div>
        </>
      )}
      {billing === 'cancelled' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          Checkout was cancelled. You can subscribe any time from the banner above.
        </div>
      )}

      {/* Coached athlete with no block yet — coach is still building the plan */}
      {blockCount === 0 && coachRelationship && (
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Your plan is on its way</h2>
              <p className="text-primary-200 text-sm">
                {coachRelationship.coach.name
                  ? `${coachRelationship.coach.name} is building your personalised programme`
                  : 'Your coach is building your personalised programme'}
              </p>
            </div>
          </div>
          <p className="text-primary-100 text-sm leading-relaxed mb-5">
            Your coach is reviewing your goals and putting your training block together. You&apos;ll see your workouts here once it&apos;s ready — no action needed from you.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/workout/start" className="px-4 py-2 bg-white text-primary-700 font-medium text-sm rounded-lg hover:bg-primary-50 transition">
              Start a free workout
            </Link>
            <Link href="/my-coach/messages" className="px-4 py-2 bg-white/15 text-white font-medium text-sm rounded-lg hover:bg-white/25 transition">
              Message your coach
            </Link>
          </div>
        </div>
      )}

      {/* No training blocks and no coach — show welcome checklist */}
      {blockCount === 0 && !coachRelationship && (
        <WelcomeChecklist name={session.user.name} />
      )}

      {/* Stats carousel — only shown when there's an active phase */}
      {statViews.length > 0 && <StatsCarousel views={statViews} />}

      {/* Active block but no workouts built yet — coach is still programming */}
      {phaseHasNoWorkouts && coachRelationship && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 text-white">
            <p className="text-primary-200 text-xs font-semibold uppercase tracking-wide mb-1">Your training block</p>
            <h2 className="font-bold text-xl">{activeBlock?.name}</h2>
            {blockPhaseInfo && (
              <p className="text-primary-200 text-sm mt-1">
                {blockPhaseInfo.phaseCount} phase{blockPhaseInfo.phaseCount !== 1 ? 's' : ''} · {blockPhaseInfo.totalWeeks} week{blockPhaseInfo.totalWeeks !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="px-6 py-8 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">
              {coachRelationship.coach.name
                ? `${coachRelationship.coach.name} is programming your workouts`
                : 'Your coach is programming your workouts'}
            </p>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              Your training block is all set up — workouts will appear here once your coach has added the exercises and sets.
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <Link href="/workout/start" className="px-4 py-2 bg-primary-600 text-white font-medium text-sm rounded-lg hover:bg-primary-700 transition">
                Start a free workout
              </Link>
              <Link href="/my-coach/messages" className="px-4 py-2 bg-gray-100 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-200 transition">
                Message your coach
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Current week */}
      {currentMicro && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Phase header with progress — clickable link to phase details */}
          <Link href={`/mesocycles/${currentMicro.mesocycle.id}`} className="block px-6 py-4 border-b-2 border-primary-700 bg-primary-800 hover:bg-primary-900 transition">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-white">{currentMicro.mesocycle.name}</h2>
                <p className="text-sm text-primary-200">Week {weekNumber} of {totalWeeks}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-primary-200">{progressPercent}%</span>
                <svg className="w-4 h-4 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <div className="w-full bg-primary-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-300"
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
              const completedAt = workout.workoutLogs[0]?.completedAt
              const logDuration = workout.workoutLogs[0]?.duration

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
                      {isCompleted && completedAt
                        ? <LocalDate date={completedAt} options={{ weekday: 'short', day: 'numeric', month: 'short' }} />
                        : workout.dayOfWeek !== null
                          ? DAY_NAMES_FULL[workout.dayOfWeek]
                          : 'Unscheduled'}
                      {isCompleted
                        ? logDuration ? ` · ${logDuration} min` : null
                        : workout.estimatedDuration ? ` · ${workout.estimatedDuration} min` : null}
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
                  <LocalDate date={log.completedAt} />
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {log.exerciseLogs.length} exercises{log.duration ? ` · ${log.duration} min` : ''}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {unseenNotes.length > 0 && (
        <ReleaseNotesDialog unseenNotes={unseenNotes} />
      )}
    </div>
  )
}
