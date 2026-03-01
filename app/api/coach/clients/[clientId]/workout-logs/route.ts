import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachClientAccess } from '@/lib/coachAccess'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { clientId } = await params
  const hasAccess = await verifyCoachClientAccess(session.user.id, clientId)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)

  const workoutLogs = await prisma.workoutLog.findMany({
    where: { userId: clientId },
    orderBy: { completedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      completedAt: true,
      duration: true,
      overallRpe: true,
      overallRating: true,
      workout: { select: { name: true } },
      exerciseLogs: {
        select: {
          exercise: { select: { name: true } },
          weight: true,
          reps: true,
          skipped: true,
        },
      },
    },
  })

  return NextResponse.json(workoutLogs)
}
