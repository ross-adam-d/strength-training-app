import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { CoachSidebar } from '@/components/CoachSidebar'

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  if (session.user?.role !== 'COACH') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <CoachSidebar email={session.user?.email ?? ''} />

      {/* Main content — offset by mobile top bar height */}
      <div className="flex-1 flex flex-col min-h-screen pt-16 md:pt-0">
        <header className="hidden md:flex h-16 bg-white border-b border-gray-200 items-center px-8">
          <h1 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Coach Dashboard
          </h1>
        </header>
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
