import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const macrocycles = await prisma.macrocycle.findMany({
    where: {
      userId: session.user.id,
      status: 'active',
    },
    orderBy: {
      startDate: 'desc',
    },
    take: 5,
  })

  const recentWorkoutLogs = await prisma.workoutLog.findMany({
    where: {
      workout: {
        microcycle: {
          mesocycle: {
            macrocycle: {
              userId: session.user.id,
            },
          },
        },
      },
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your training overview.</p>
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
                <div key={log.id} className="p-3 border rounded-md">
                  <h3 className="font-medium">{log.workout.name}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(log.completedAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {log.exerciseLogs.length} exercises • {log.duration || '—'} min
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
