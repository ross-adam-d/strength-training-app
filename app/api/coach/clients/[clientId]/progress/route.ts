import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachClientAccess } from '@/lib/coachAccess'
import { estimate1RM } from '@/lib/progressiveOverload'

export async function GET(
  _request: Request,
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

  const logs = await prisma.exerciseLog.findMany({
    where: {
      workoutLog: { userId: clientId },
      skipped: false,
      reps: { gt: 0 },
      weight: { gt: 0 },
    },
    select: {
      exerciseId: true,
      weight: true,
      reps: true,
      exercise: { select: { name: true } },
      workoutLog: { select: { completedAt: true } },
    },
  })

  const byExercise = new Map<
    string,
    { exerciseName: string; est1RM: number; lastLoggedAt: Date }
  >()

  for (const log of logs) {
    const est = estimate1RM(log.weight, log.reps)
    const existing = byExercise.get(log.exerciseId)
    if (!existing) {
      byExercise.set(log.exerciseId, {
        exerciseName: log.exercise.name,
        est1RM: est,
        lastLoggedAt: log.workoutLog.completedAt,
      })
    } else {
      if (est > existing.est1RM) existing.est1RM = est
      if (log.workoutLog.completedAt > existing.lastLoggedAt) {
        existing.lastLoggedAt = log.workoutLog.completedAt
      }
    }
  }

  const result = Array.from(byExercise.entries())
    .map(([exerciseId, data]) => ({
      exerciseId,
      exerciseName: data.exerciseName,
      est1RM: Math.round(data.est1RM),
      est5RM: Math.round(data.est1RM * (30 / 35)),
      est10RM: Math.round(data.est1RM * (30 / 40)),
      lastLoggedAt: data.lastLoggedAt.toISOString(),
    }))
    .sort((a, b) => b.est1RM - a.est1RM)

  return NextResponse.json(result)
}
