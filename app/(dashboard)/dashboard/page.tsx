import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { NextWorkoutCard } from '@/components/NextWorkoutCard'

// Cache dashboard data for 30 seconds
export const revalidate = 30

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  // Optimized: Only fetch active macrocycle metadata first
  const activeBlock = await prisma.macrocycle.findFirst({
    where: { userId: session.user.id, status: 'active' },
    orderBy: { startDate: 'desc' },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
    },
  })

  // Optimized: Single query to find next uncompleted workout
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const now = new Date()
  const todayDow = now.getDay()
  let nextWorkout: { id: string; name: string; dayOfWeek: number | null; microcycle?: any } | null = null
  let nextWorkoutLabel = ''

  if (activeBlock) {
    try {
      // Find first uncompleted workout in a single query
      const uncompletedWorkout = await prisma.workout.findFirst({
        where: {
          microcycle: {
            mesocycle: {
              macrocycleId: activeBlock.id,
            },
            endDate: {
              gte: now, // Only current or future weeks
            },
          },
          workoutLogs: {
            none: {}, // No workout logs = uncompleted
          },
        },
        orderBy: [
          { microcycle: { weekNumber: 'asc' } },
          { dayOfWeek: 'asc' },
        ],
        select: {
          id: true,
          name: true,
          dayOfWeek: true,
          microcycle: {
            select: {
              weekNumber: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      })

      if (uncompletedWorkout) {
        nextWorkout = uncompletedWorkout
        const microStartDate = new Date(uncompletedWorkout.microcycle.startDate)
        const microEndDate = new Date(uncompletedWorkout.microcycle.endDate)

        // Determine label
        if (now >= microStartDate && now < microEndDate) {
          // Current week
          if (uncompletedWorkout.dayOfWeek === todayDow) {
            nextWorkoutLabel = 'Today'
          } else if (uncompletedWorkout.dayOfWeek !== null) {
            nextWorkoutLabel = DAY_NAMES[uncompletedWorkout.dayOfWeek]
          } else {
            nextWorkoutLabel = 'This Week'
          }
        } else {
          // Future week
          nextWorkoutLabel = `Week ${uncompletedWorkout.microcycle.weekNumber}`
        }
      }
    } catch (err) {
      console.error('Error finding next workout:', err)
    }
  }

  // Optimized: Single query to find current phase
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
    try {
      // Find mesocycle containing current week
      const currentMesocycle = await prisma.mesocycle.findFirst({
        where: {
          macrocycleId: activeBlock.id,
          microcycles: {
            some: {
              startDate: { lte: now },
              endDate: { gt: now },
            },
          },
        },
        select: {
          id: true,
          name: true,
          focus: true,
          status: true,
          startDate: true,
          endDate: true,
          microcycles: {
            select: {
              id: true,
              weekNumber: true,
              startDate: true,
              endDate: true,
            },
            orderBy: { weekNumber: 'asc' },
          },
        },
      })

      if (currentMesocycle) {
        // Find which week we're in
        const currentWeekIndex = currentMesocycle.microcycles.findIndex(
          (micro) => now >= micro.startDate && now < micro.endDate
        )

        currentPhase = {
          id: currentMesocycle.id,
          name: currentMesocycle.name,
          focus: currentMesocycle.focus,
          status: currentMesocycle.status || 'active',
          startDate: currentMesocycle.startDate,
          endDate: currentMesocycle.endDate,
          weekNumber: currentWeekIndex + 1,
          totalWeeks: currentMesocycle.microcycles.length,
          macrocycleId: activeBlock.id,
          macrocycleName: activeBlock.name,
        }
      }
    } catch (err) {
      console.error('Error finding current phase:', err)
    }
  }

  // Optimized: Only fetch what we need for display
  const recentWorkoutLogs = await prisma.workoutLog.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      completedAt: 'desc',
    },
    take: 5,
    select: {
      id: true,
      completedAt: true,
      duration: true,
      workout: {
        select: {
          name: true,
        },
      },
      exerciseLogs: {
        select: {
          exerciseId: true, // Only need ID for counting unique exercises
        },
        distinct: ['exerciseId'],
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
                    {log.exerciseLogs.length} exercises • {log.duration || '—'} min
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
