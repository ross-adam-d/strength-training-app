import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

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
                workouts: { orderBy: { dayOfWeek: 'asc' } },
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

  if (activeBlock) {
    for (const meso of activeBlock.mesocycles) {
      for (const micro of meso.microcycles) {
        if (now >= micro.startDate && now < micro.endDate) {
          // Current week — find today's workout first, then next upcoming
          const todayMatch = micro.workouts.find((w) => w.dayOfWeek === todayDow)
          if (todayMatch) {
            nextWorkout = todayMatch
            nextWorkoutLabel = 'Today'
          } else {
            const upcoming = micro.workouts.find(
              (w) => w.dayOfWeek !== null && w.dayOfWeek > todayDow
            )
            if (upcoming) {
              nextWorkout = upcoming
              nextWorkoutLabel = DAY_NAMES[upcoming.dayOfWeek!]
            }
          }
          break
        }
      }
      if (nextWorkout) break
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
        {nextWorkout ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{nextWorkoutLabel}</p>
              <p className="text-xl font-bold text-gray-900">{nextWorkout.name}</p>
            </div>
            <Link
              href={`/workouts/${nextWorkout.id}/log`}
              className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
            >
              Start
            </Link>
          </div>
        ) : activeBlock ? (
          <p className="text-gray-500">All workouts completed this week</p>
        ) : (
          <p className="text-gray-500">No active training block</p>
        )}
        <div className="mt-3 pt-3 border-t">
          <Link href="/workout/start" className="text-sm text-primary-600 hover:text-primary-700">
            + Log a manual workout
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Active Macrocycles</h2>
            <Link
              href="/macrocycles"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All
            </Link>
          </div>

          {macrocycles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No active training cycles</p>
              <Link
                href="/macrocycles"
                className="inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
              >
                Create Your First Macrocycle
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {macrocycles.map((macro) => (
                <Link
                  key={macro.id}
                  href={`/macrocycles/${macro.id}`}
                  className="block p-3 border rounded-md hover:bg-gray-50 transition"
                >
                  <h3 className="font-medium">{macro.name}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(macro.startDate).toLocaleDateString()} -{' '}
                    {new Date(macro.endDate).toLocaleDateString()}
                  </p>
                </Link>
              ))}
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
