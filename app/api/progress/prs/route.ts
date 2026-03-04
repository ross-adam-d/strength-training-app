import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { estimate1RM } from '@/lib/progressiveOverload'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const logs = await prisma.exerciseLog.findMany({
    where: {
      workoutLog: { userId: session.user.id },
      skipped: false,
      weight: { gt: 0 },
      OR: [{ reps: { gt: 0 } }, { repsLeft: { gt: 0 } }],
    },
    select: {
      exerciseId: true,
      weight: true,
      reps: true,
      repsLeft: true,
      exercise: { select: { name: true } },
      workoutLog: { select: { completedAt: true } },
    },
  })

  // Group by exercise: track max est 1RM and most recent log date
  const byExercise = new Map<
    string,
    { exerciseName: string; est1RM: number; lastLoggedAt: Date }
  >()

  for (const log of logs) {
    const effectiveReps = log.reps > 0 ? log.reps : (log.repsLeft ?? 0)
    const est = estimate1RM(log.weight, effectiveReps)
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

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, s-maxage=300' },
  })
}
