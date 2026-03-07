import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function CoachDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const [relationships, coachProfile] = await Promise.all([
    prisma.coachClientRelationship.findMany({
      where: { coachId: session.user.id, status: { in: ['ACTIVE', 'PENDING'] } },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            workoutLogs: {
              orderBy: { completedAt: 'desc' },
              take: 1,
              select: { completedAt: true },
            },
            macrocycles: {
              where: { status: 'active' },
              take: 1,
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.coachProfile.findUnique({
      where: { userId: session.user.id },
      select: { maxClients: true },
    }),
  ])

  const activeClients = relationships.filter((r) => r.status === 'ACTIVE')
  const pendingInvites = relationships.filter((r) => r.status === 'PENDING')
  const maxClients = coachProfile?.maxClients ?? 5

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
          <p className="text-sm text-gray-500 mt-1">
            {activeClients.length} of {maxClients} seats used
          </p>
        </div>
        <Link
          href="/coach/invite"
          className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition"
        >
          + Invite client
        </Link>
      </div>

      {activeClients.length === 0 && pendingInvites.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">👥</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No clients yet</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Invite a client to get started. They&apos;ll receive a link to connect their account.
          </p>
          <Link
            href="/coach/invite"
            className="inline-block px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition"
          >
            Invite your first client
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {activeClients.map((rel) => {
            const lastWorkout = rel.client.workoutLogs[0]?.completedAt
            const activeBlock = rel.client.macrocycles[0]
            return (
              <div key={rel.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{rel.client.name ?? rel.client.email}</p>
                  {rel.client.name && <p className="text-sm text-gray-500 truncate">{rel.client.email}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400">
                    {activeBlock && (
                      <span className="truncate max-w-[180px]">Block: {activeBlock.name}</span>
                    )}
                    {lastWorkout && (
                      <span>
                        Last: {new Date(lastWorkout).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    {!lastWorkout && <span>No workouts logged</span>}
                  </div>
                </div>
                <Link
                  href={`/coach/clients/${rel.client.id}`}
                  className="flex-shrink-0 px-4 py-2 text-sm font-medium text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 transition"
                >
                  View
                </Link>
              </div>
            )
          })}

          {pendingInvites.map((rel) => (
            <div key={rel.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4 opacity-60">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{rel.client.name ?? rel.client.email}</p>
                {rel.client.name && <p className="text-sm text-gray-500 truncate">{rel.client.email}</p>}
              </div>
              <span className="flex-shrink-0 px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                Invite pending
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
