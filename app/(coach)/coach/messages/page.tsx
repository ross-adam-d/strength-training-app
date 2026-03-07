import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function CoachMessagesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') redirect('/dashboard')

  const relationships = await prisma.coachClientRelationship.findMany({
    where: { coachId: session.user.id, status: 'ACTIVE' },
    include: {
      client: { select: { id: true, name: true, email: true } },
      messages: {
        where: { senderRole: 'CLIENT', readAt: null },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  if (relationships.length === 0) {
    return (
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Messages</h2>
        <p className="text-sm text-gray-500 mb-8">Chat with your active clients.</p>

        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No active clients yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">
            Invite your clients to start messaging.
          </p>
          <Link
            href="/coach/invite"
            className="inline-block px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition"
          >
            Invite a client
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Messages</h2>
      <p className="text-sm text-gray-500 mb-6">Chat with your active clients.</p>

      <div className="space-y-2">
        {relationships.map((rel) => {
          const displayName = rel.client.name ?? rel.client.email
          const unread = rel.messages.length
          return (
            <Link
              key={rel.id}
              href={`/coach/clients/${rel.client.id}/messages`}
              className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-primary-300 hover:shadow-sm transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 font-semibold text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-400">{rel.client.email}</p>
                </div>
              </div>
              {unread > 0 && (
                <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
