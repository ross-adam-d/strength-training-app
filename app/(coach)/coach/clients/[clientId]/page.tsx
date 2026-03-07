import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachClientAccess } from '@/lib/coachAccess'
import Link from 'next/link'

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') redirect('/dashboard')

  const { clientId } = await params
  const hasAccess = await verifyCoachClientAccess(session.user.id, clientId)
  if (!hasAccess) redirect('/coach')

  const [client, relationship] = await Promise.all([
    prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        workoutLogs: {
          orderBy: { completedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            completedAt: true,
            duration: true,
            overallRpe: true,
            workout: { select: { name: true } },
            exerciseLogs: {
              select: { exercise: { select: { name: true } }, skipped: true },
            },
          },
        },
        macrocycles: {
          where: { status: { in: ['active', 'planned'] } },
          take: 1,
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            createdByCoachId: true,
            mesocycles: {
              orderBy: { startDate: 'asc' },
              select: { id: true, name: true, status: true, goal: true },
            },
          },
        },
        _count: {
          select: { workoutLogs: true, macrocycles: true },
        },
      },
    }),
    prisma.coachClientRelationship.findUnique({
      where: { coachId_clientId: { coachId: session.user.id, clientId } },
      select: { status: true, createdAt: true },
    }),
  ])

  if (!client) redirect('/coach')

  const activeBlock = client.macrocycles[0] ?? null
  const recentLogs = client.workoutLogs

  const lastWorkout = recentLogs[0]
  const daysSinceLastWorkout = lastWorkout
    ? Math.floor((Date.now() - new Date(lastWorkout.completedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-medium leading-tight">Workouts</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{client._count.workoutLogs}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-medium leading-tight">Blocks</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{client._count.macrocycles}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-medium leading-tight">Last workout</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
            {daysSinceLastWorkout === null
              ? '—'
              : daysSinceLastWorkout === 0
              ? 'Today'
              : daysSinceLastWorkout === 1
              ? '1d'
              : `${daysSinceLastWorkout}d`}
          </p>
        </div>
      </div>

      {/* Active block */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Active training block</h3>
        {activeBlock ? (
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <Link href={`/macrocycles/${activeBlock.id}`} className="min-w-0 flex-1 group">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gray-900 group-hover:text-primary-600 transition">{activeBlock.name}</p>
                  {activeBlock.createdByCoachId === session.user.id && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700 flex-shrink-0">
                      Created by you
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {new Date(activeBlock.startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                  {' – '}
                  {new Date(activeBlock.endDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </Link>
              <Link
                href={`/coach/clients/${clientId}/blocks`}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex-shrink-0"
              >
                View all
              </Link>
            </div>
            {activeBlock.mesocycles.length > 0 && (
              <div className="space-y-1.5">
                {activeBlock.mesocycles.map((meso) => (
                  <Link key={meso.id} href={`/mesocycles/${meso.id}`} className="flex items-center gap-2 text-sm min-w-0 hover:bg-gray-50 rounded-lg -mx-1 px-1 py-0.5 transition">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        meso.status === 'active'
                          ? 'bg-green-500'
                          : meso.status === 'completed'
                          ? 'bg-blue-400'
                          : 'bg-gray-300'
                      }`}
                    />
                    <span className="text-gray-700 truncate flex-1 min-w-0">{meso.name}</span>
                    <span
                      className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded ${
                        meso.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : meso.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {meso.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No active training block</p>
        )}
      </div>

      {/* Recent workouts */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Recent workouts</h3>
          <Link
            href={`/coach/clients/${clientId}/history`}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all
          </Link>
        </div>
        {recentLogs.length === 0 ? (
          <p className="text-sm text-gray-400">No workouts logged yet</p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => {
              const uniqueExercises = new Set(
                log.exerciseLogs.filter((e) => !e.skipped).map((e) => e.exercise.name)
              ).size
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {log.workout?.name ?? 'Manual workout'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(log.completedAt).toLocaleDateString('en-AU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                      {log.duration && ` · ${log.duration} min`}
                      {uniqueExercises > 0 && ` · ${uniqueExercises} exercises`}
                      {log.overallRpe && ` · RPE ${log.overallRpe}`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Relationship info */}
      {relationship && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Coaching relationship</h3>
          <p className="text-sm text-gray-500">
            Since{' '}
            {new Date(relationship.createdAt).toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            {' · '}
            <span
              className={`font-medium ${
                relationship.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              {relationship.status}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
