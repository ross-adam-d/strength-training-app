import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Returns a sensible bodyweight prefill for the workout logger:
// the most recently logged session bodyweight, falling back to the profile weight.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [lastLog, profile] = await Promise.all([
    prisma.workoutLog.findFirst({
      where: { userId: session.user.id, bodyweight: { not: null } },
      orderBy: { completedAt: 'desc' },
      select: { bodyweight: true },
    }),
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { weight: true },
    }),
  ])

  return NextResponse.json({
    bodyweight: lastLog?.bodyweight ?? profile?.weight ?? null,
  })
}
