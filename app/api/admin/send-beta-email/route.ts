import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendBetaEmail } from '@/lib/email'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { dryRun } = await request.json().catch(() => ({ dryRun: false }))

  // Target: verified USER-role accounts that are not already active paying subscribers
  const users = await prisma.user.findMany({
    where: {
      emailVerified: { not: null },
      role: 'USER',
      subscription: {
        status: { not: 'ACTIVE' },
      },
    },
    select: { id: true, email: true, name: true },
    orderBy: { createdAt: 'asc' },
  })

  if (dryRun) {
    return NextResponse.json({ count: users.length, users: users.map(u => u.email) })
  }

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const user of users) {
    try {
      await sendBetaEmail({ toEmail: user.email, name: user.name })
      sent++
      // Small delay to stay within Resend rate limits
      await new Promise((r) => setTimeout(r, 100))
    } catch (err: any) {
      failed++
      errors.push(`${user.email}: ${err?.message ?? 'unknown error'}`)
      console.error(`[beta-email] Failed to send to ${user.email}:`, err)
    }
  }

  return NextResponse.json({ sent, failed, errors })
}
