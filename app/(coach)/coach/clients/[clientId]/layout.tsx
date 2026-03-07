import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachClientAccess } from '@/lib/coachAccess'
import Link from 'next/link'

const tabs = [
  { label: 'Overview', href: '' },
  { label: 'Blocks', href: '/blocks' },
  { label: 'History', href: '/history' },
  { label: 'Progress', href: '/progress' },
  { label: 'Messages', href: '/messages' },
]

export default async function ClientDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clientId: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') redirect('/dashboard')

  const { clientId } = await params
  const hasAccess = await verifyCoachClientAccess(session.user.id, clientId)
  if (!hasAccess) redirect('/coach')

  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, email: true },
  })

  if (!client) redirect('/coach')

  const displayName = client.name ?? client.email

  return (
    <div className="max-w-3xl">
      {/* Client header */}
      <div className="mb-5">
        <Link href="/coach" className="text-primary-600 hover:text-primary-700 text-sm">
          ← All Clients
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 mt-3">{displayName}</h2>
        {client.name && (
          <p className="text-sm text-gray-500 mt-0.5">{client.email}</p>
        )}
      </div>

      {/* Tab navigation — scrollable on mobile */}
      <div className="overflow-x-auto -mx-6 px-6 md:-mx-8 md:px-8 mb-6">
        <div className="flex gap-1 border-b border-gray-200 min-w-max">
          {tabs.map((tab) => (
            <Link
              key={tab.label}
              href={`/coach/clients/${clientId}${tab.href}`}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 transition -mb-px whitespace-nowrap"
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {children}
    </div>
  )
}
