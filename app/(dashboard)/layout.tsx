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
  let session
  try {
    session = await getServerSession(authOptions)
  } catch (e: any) {
    console.error('[Layout] getServerSession threw:', e?.message, e?.stack)
    throw e
  }

  if (!session) {
    redirect('/login')
  }

  console.log('[Layout] session.user.id:', session.user?.id, 'email:', session.user?.email)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation email={session.user?.email ?? ''} role={session.user?.role} />
      <SubscriptionBanner userId={session.user?.id} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
