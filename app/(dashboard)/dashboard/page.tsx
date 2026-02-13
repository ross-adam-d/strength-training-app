import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { NextWorkoutCard } from '@/components/NextWorkoutCard'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const [macrocycles, activeBlock] = await Promise.all([
    prisma.macrocycle.findMany({
      where: { userId: session.user.id, status: 'active' },
      orderBy: { startDate: 'desc' },
      take: 5,
    }),
    prisma.macrocycle.findFirst({
      where: { userId: session.user.id, status: 'active' },
      orderBy: { startDate: 'desc' },
      include: {
        mesocycles: {
          orderBy: { startDate: 'asc' },
          include: {
            microcycles: {
              orderBy: { weekNumber: 'asc' },
              include: {
                workouts: {
                  orderBy: { dayOfWeek: 'asc' },
                  include: {
                    workoutLogs: { select: { id: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
  ])

  // Determine next workout due from the active block
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const now = new Date()
  const todayDow = now.getDay()
  let nextWorkout: { id: string; name: string; dayOfWeek: number | null } | null = null
  let nextWorkoutLabel = ''

  try {
    if (activeBlock?.mesocycles) {
      // Find the first uncompleted workout in the current or future weeks
      for (const meso of activeBlock.mesocycles) {
        if (!meso?.microcycles) continue

        for (const micro of meso.microcycles) {
          try {
            // Check current and future weeks
            const endDate = new Date(micro.endDate)
            if (now >= endDate) continue

            // Sort workouts by day of week
            const workouts = micro.workouts || []
            const sortedWorkouts = [...workouts].sort((a, b) => {
              const dayA = a.dayOfWeek ?? 999
              const dayB = b.dayOfWeek ?? 999
              return dayA - dayB
            })

            // Find first uncompleted workout
            for (const workout of sortedWorkouts) {
              const isCompleted = workout.workoutLogs && workout.workoutLogs.length > 0
              if (!isCompleted) {
                nextWorkout = workout

                // Determine label based on day
                const startDate = new Date(micro.startDate)
                if (now >= startDate && now < endDate) {
                  // Current week
                  if (workout.dayOfWeek === todayDow) {
                    nextWorkoutLabel = 'Today'
                  } else if (workout.dayOfWeek !== null) {
                    nextWorkoutLabel = DAY_NAMES[workout.dayOfWeek]
                  } else {
                    nextWorkoutLabel = 'This Week'
                  }
                } else {
                  // Future week
                  nextWorkoutLabel = `Week ${micro.weekNumber}`
                }
                break
              }
            }

            if (nextWorkout) break
          } catch (err) {
            // Skip this microcycle if there's an error
            console.error('Error processing microcycle:', err)
            continue
          }
        }
        if (nextWorkout) break
      }
    }
  } catch (err) {
    console.error('Error determining next workout:', err)
    // Silently fail - just won't show next workout
  }

  // Determine current phase (mesocycle) from active block
  let currentPhase: {
    id: string
    name: string
    focus: string | null
    status: string
    startDate: Date
    endDate: Date
    weekNumber: number
    totalWeeks: number
    macrocycleId: string
    macrocycleName: string
  } | null = null

  if (activeBlock) {
    for (const meso of activeBlock.mesocycles) {
      // Check if this mesocycle contains the current week
      for (let i = 0; i < meso.microcycles.length; i++) {
        const micro = meso.microcycles[i]
        if (now >= micro.startDate && now < micro.endDate) {
          currentPhase = {
            id: meso.id,
            name: meso.name,
            focus: meso.focus,
            status: meso.status || 'active',
            startDate: meso.startDate,
            endDate: meso.endDate,
            weekNumber: i + 1,
            totalWeeks: meso.microcycles.length,
            macrocycleId: activeBlock.id,
            macrocycleName: activeBlock.name,
          }
          break
        }
      }
      if (currentPhase) break
    }
  }

  const recentWorkoutLogs = await prisma.workoutLog.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      completedAt: 'desc',
    },
    take: 5,
    include: {
      workout: true,
      exerciseLogs: {
        include: {
          exercise: true,
        },
      },
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here&apos;s your training overview.</p>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-3">Next Workout</h2>
        <NextWorkoutCard workout={nextWorkout} label={nextWorkoutLabel} hasActiveBlock={!!activeBlock} />
        <div className="mt-3 pt-3 border-t">
          <Link href="/workout/start" className="text-sm text-primary-600 hover:text-primary-700">
            + Log a manual workout
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Current Phase</h2>
          </div>

          {!currentPhase ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No active training phase</p>
              <Link
                href="/macrocycles"
                className="inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
              >
                Create Your First Training Block
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Phase header */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Link
                      href={`/macrocycles/${currentPhase.macrocycleId}`}
                      className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition"
                    >
                      {currentPhase.name}
                    </Link>
                    <p className="text-sm text-gray-600">{currentPhase.macrocycleName}</p>
                  </div>
                  <div className="flex gap-2">
                    {currentPhase.focus && (
                      <span className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-full">
                        {currentPhase.focus}
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        currentPhase.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : currentPhase.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {currentPhase.status}
                    </span>
                  </div>
                </div>

                {/* Week progress */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Week {currentPhase.weekNumber} of {currentPhase.totalWeeks}</span>
                  <span className="text-gray-400">•</span>
                  <span>
                    {currentPhase.startDate.toLocaleDateString()} - {currentPhase.endDate.toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(currentPhase.weekNumber / currentPhase.totalWeeks) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {Math.round((currentPhase.weekNumber / currentPhase.totalWeeks) * 100)}% complete
                </p>
              </div>

              {/* View current week link */}
              <div className="pt-3 border-t">
                <Link
                  href={`/microcycles/${currentPhase.id}`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Week Details →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Workouts</h2>

          {recentWorkoutLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No workouts logged yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWorkoutLogs.map((log) => (
                <Link key={log.id} href={`/workout-logs/${log.id}`} className="block p-3 border rounded-md hover:bg-gray-50 transition">
                  <h3 className="font-medium">{log.workout?.name ?? 'Manual Workout'}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(log.completedAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Set(log.exerciseLogs.map((el) => el.exercise.id)).size} exercises • {log.duration || '—'} min
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
