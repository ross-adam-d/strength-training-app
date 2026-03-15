import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BetaEmailButton } from '@/components/admin/BetaEmailButton'

function statusBadge(
  status: string | null,
  trialEndsAt: Date | null,
  manualAccessGrantedUntil: Date | null
) {
  const now = new Date()

  if (manualAccessGrantedUntil && manualAccessGrantedUntil > now) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        Admin override
      </span>
    )
  }

  if (status === 'TRIALING') {
    if (trialEndsAt && trialEndsAt > now) {
      const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isExpiringSoon = daysLeft <= 7
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isExpiringSoon ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
        }`}>
          {isExpiringSoon ? `Expiring in ${daysLeft}d` : `Trial (${daysLeft}d left)`}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Trial expired
      </span>
    )
  }

  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    )
  }

  if (status === 'READ_ONLY') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Read only
      </span>
    )
  }

  if (status === 'CANCELLED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Cancelled
      </span>
    )
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      No subscription
    </span>
  )
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') redirect('/dashboard')

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      subscription: {
        select: {
          status: true,
          trialEndsAt: true,
          manualAccessGrantedUntil: true,
          cancelledAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-8">
      <BetaEmailButton />

      <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Users</h2>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Trial ends
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
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name ?? '—'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    {user.role === 'ADMIN' && (
                      <span className="inline-block mt-0.5 text-xs text-primary-600 font-medium">Admin</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {statusBadge(
                    user.subscription?.status ?? null,
                    user.subscription?.trialEndsAt ?? null,
                    user.subscription?.manualAccessGrantedUntil ?? null
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.subscription?.trialEndsAt
                    ? new Date(user.subscription.trialEndsAt).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 transition"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  )
}
