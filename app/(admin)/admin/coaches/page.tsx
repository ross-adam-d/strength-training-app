import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminCoachesPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') redirect('/dashboard')

  const coaches = await prisma.user.findMany({
    where: { role: 'COACH' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      coachProfile: {
        select: { maxClients: true },
      },
      coachRelationships: {
        where: { status: 'ACTIVE' },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Coaches</h2>
          <p className="text-sm text-gray-500 mt-0.5">{coaches.length} total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Coach
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Clients
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Capacity
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coaches.map((coach) => {
              const activeCount = coach.coachRelationships.length
              const maxClients = coach.coachProfile?.maxClients ?? 5
              const pct = Math.min(100, Math.round((activeCount / maxClients) * 100))
              const isFull = activeCount >= maxClients
              const isNearFull = !isFull && pct >= 80

              return (
                <tr key={coach.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{coach.name ?? '—'}</p>
                    <p className="text-xs text-gray-500">{coach.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 font-medium">{activeCount}</span>
                    <span className="text-sm text-gray-400"> / {maxClients}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            isFull
                              ? 'bg-red-500'
                              : isNearFull
                              ? 'bg-amber-400'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {isFull && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Full
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(coach.createdAt).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/users/${coach.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 transition"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              )
            })}
            {coaches.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                  No coaches yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
