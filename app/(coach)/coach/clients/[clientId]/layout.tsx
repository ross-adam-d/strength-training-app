import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachClientAccess } from '@/lib/coachAccess'

const tabs = [
  { label: 'Overview', href: '' },
  { label: 'Blocks', href: '/blocks' },
  { label: 'History', href: '/history' },
  { label: 'Progress', href: '/progress' },
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
    <div className="max-w-5xl">
      {/* Client header */}
      <div className="mb-6">
        <a href="/coach" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All clients
        </a>
        <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
        {client.name && (
          <p className="text-sm text-gray-500 mt-0.5">{client.email}</p>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <a
            key={tab.label}
            href={`/coach/clients/${clientId}${tab.href}`}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 transition -mb-px"
          >
            {tab.label}
          </a>
        ))}
      </div>

      {children}
    </div>
  )
}
