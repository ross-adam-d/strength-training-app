import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const FOCUS_COLOURS: Record<string, string> = {
  hypertrophy: 'bg-blue-100 text-blue-700',
  strength:    'bg-orange-100 text-orange-700',
  power:       'bg-purple-100 text-purple-700',
  endurance:   'bg-green-100 text-green-700',
  deload:      'bg-gray-100 text-gray-600',
}

export default async function CoachDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const [relationships, coachProfile, templates] = await Promise.all([
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
        messages: {
          where: { senderRole: 'CLIENT', readAt: null },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.coachProfile.findUnique({
      where: { userId: session.user.id },
      select: { maxClients: true },
    }),
    prisma.coachPhaseTemplate.findMany({
      where: { coachId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 4,
      select: {
        id: true,
        name: true,
        focus: true,
        trainingSplit: true,
        daysPerWeek: true,
        defaultWeeks: true,
        _count: { select: { workouts: true } },
      },
    }),
  ])

  const activeClients = relationships.filter((r) => r.status === 'ACTIVE')
  const pendingInvites = relationships.filter((r) => r.status === 'PENDING')
  const maxClients = coachProfile?.maxClients ?? 5
  const totalUnread = relationships.reduce((sum, r) => sum + r.messages.length, 0)
  const clientsWithMessages = relationships.filter((r) => r.messages.length > 0)

  return (
    <div className="max-w-4xl space-y-10">

      {/* ── Clients ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Clients</h2>
            <p className="text-sm text-gray-500 mt-0.5">{activeClients.length} of {maxClients} seats used</p>
          </div>
          <Link
            href="/coach/invite"
            className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition"
          >
            + Invite
          </Link>
        </div>

        {activeClients.length === 0 && pendingInvites.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
            <p className="text-gray-500 text-sm mb-4">No clients yet — invite someone to get started.</p>
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
              const unread = rel.messages.length
              return (
                <div key={rel.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{rel.client.name ?? rel.client.email}</p>
                      {unread > 0 && (
                        <span className="flex-shrink-0 bg-primary-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                          {unread}
                        </span>
                      )}
                    </div>
                    {rel.client.name && <p className="text-sm text-gray-500 truncate">{rel.client.email}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400">
                      {activeBlock && <span className="truncate max-w-[180px]">Block: {activeBlock.name}</span>}
                      {lastWorkout
                        ? <span>Last: {new Date(lastWorkout).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                        : <span>No workouts logged</span>
                      }
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
      </section>

      {/* ── Messages ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            {totalUnread > 0 && (
              <p className="text-sm text-primary-600 font-medium mt-0.5">{totalUnread} unread message{totalUnread !== 1 ? 's' : ''}</p>
            )}
          </div>
          <Link href="/coach/messages" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all →
          </Link>
        </div>

        {activeClients.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
            <p className="text-gray-500 text-sm">Messages appear here once you have active clients.</p>
          </div>
        ) : clientsWithMessages.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm">No unread messages</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clientsWithMessages.map((rel) => {
              const displayName = rel.client.name ?? rel.client.email
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
                    <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                  </div>
                  <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {rel.messages.length}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Phase Templates ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Phase Templates</h2>
            <p className="text-sm text-gray-500 mt-0.5">Reusable workout structures</p>
          </div>
          <Link href="/coach/templates" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all →
          </Link>
        </div>

        {templates.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
            <p className="text-gray-500 text-sm mb-4">No templates yet — build reusable phase structures to apply to clients.</p>
            <Link
              href="/coach/templates/new"
              className="inline-block px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition"
            >
              Create first template
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/coach/templates/new"
              className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-primary-400 hover:text-primary-600 transition flex items-center justify-center text-sm font-medium text-gray-400 min-h-[80px]"
            >
              + New Template
            </Link>
            {templates.map((t) => (
              <Link
                key={t.id}
                href={`/coach/templates/${t.id}`}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-400 hover:shadow-sm transition block"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{t.name}</h3>
                  {t.focus && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${FOCUS_COLOURS[t.focus] ?? 'bg-gray-100 text-gray-600'}`}>
                      {t.focus}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                  {t.trainingSplit && <span>{t.trainingSplit}</span>}
                  {t.daysPerWeek && <span>{t.daysPerWeek} days/week</span>}
                  <span>{t.defaultWeeks} weeks</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
