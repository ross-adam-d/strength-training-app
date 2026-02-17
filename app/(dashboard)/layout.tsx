import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Navigation } from '@/components/navigation'
import { SubscriptionBanner } from '@/components/SubscriptionBanner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation email={session.user?.email ?? ''} role={session.user?.role} />
      <SubscriptionBanner userId={session.user.id} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
