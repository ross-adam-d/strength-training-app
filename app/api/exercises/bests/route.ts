import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { estimate1RM } from '@/lib/progressiveOverload'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) ?? []
  if (ids.length === 0) return NextResponse.json({})

  const logs = await prisma.exerciseLog.findMany({
    where: {
      exerciseId: { in: ids },
      skipped: false,
      weight: { gt: 0 },
      OR: [{ reps: { gt: 0 } }, { repsLeft: { gt: 0 } }],
      workoutLog: { userId: session.user.id },
    },
    select: {
      exerciseId: true,
      weight: true,
      reps: true,
      repsLeft: true,
    },
  })

  const bests: Record<string, number> = {}
  for (const log of logs) {
    const effectiveReps = log.reps > 0 ? log.reps : (log.repsLeft ?? 0)
    const oneRM = estimate1RM(log.weight, effectiveReps)
    if (!bests[log.exerciseId] || oneRM > bests[log.exerciseId]) {
      bests[log.exerciseId] = oneRM
    }
  }

  return NextResponse.json(bests)
}
