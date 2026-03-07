import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
export default async function MyCoachPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  // Coaches don't have a "my coach" page
  if (session.user.role === 'COACH') redirect('/coach')

  const relationship = await prisma.coachClientRelationship.findFirst({
    where: {
      clientId: session.user.id,
      status: { in: ['ACTIVE', 'PENDING'] },
    },
    include: {
      coach: {
        select: {
          id: true,
          name: true,
          email: true,
          coachProfile: { select: { bio: true, contactPhone: true, officeHours: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const unreadCount = relationship?.status === 'ACTIVE'
    ? await prisma.coachMessage.count({
        where: { relationshipId: relationship.id, senderRole: 'COACH', readAt: null },
      })
    : 0

  if (!relationship) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Coach</h1>
        <p className="text-gray-500 mb-8">Connect with a coach to get personalised programming.</p>

        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No coach assigned</p>
          <p className="text-sm text-gray-400 mt-1">
            Ask your coach to send you an invite link to connect.
          </p>
        </div>
      </div>
    )
  }

  const coach = relationship.coach
  const displayName = coach.name ?? coach.email
  const isPending = relationship.status === 'PENDING'

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Coach</h1>
      <p className="text-gray-500 mb-8">Your coaching relationship and details.</p>

      {isPending && (
        <div className="mb-5 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 text-sm text-yellow-800">
          Your coach invitation is pending acceptance.
        </div>
      )}

      {/* Coach card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-bold text-lg">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-lg">{displayName}</p>
            <p className="text-sm text-gray-500">{coach.email}</p>
            {coach.coachProfile?.bio && (
              <p className="text-sm text-gray-600 mt-3">{coach.coachProfile.bio}</p>
            )}
            {(coach.coachProfile?.contactPhone || coach.coachProfile?.officeHours) && (
              <div className="mt-3 space-y-1">
                {coach.coachProfile.contactPhone && (
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-gray-700">Phone:</span>{' '}
                    {coach.coachProfile.contactPhone}
                  </p>
                )}
                {coach.coachProfile.officeHours && (
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-gray-700">Hours:</span>{' '}
                    {coach.coachProfile.officeHours}
                  </p>
                )}
              </div>
            )}
          </div>
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
              isPending
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {isPending ? 'Pending' : 'Active'}
          </span>
        </div>

        <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Connected since{' '}
            {new Date(relationship.createdAt).toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          {!isPending && (
            <Link
              href="/my-coach/messages"
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Messages
              {unreadCount > 0 && (
                <span className="bg-white text-primary-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>

      {/* What your coach can see */}
      {!isPending && (
        <div className="mt-5 bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">What your coach can see</h3>
          <ul className="space-y-1.5 text-sm text-gray-500">
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Your workout history
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Your training blocks and phases
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Your estimated maxes and progress
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
