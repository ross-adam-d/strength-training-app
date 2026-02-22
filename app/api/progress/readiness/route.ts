import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const now = new Date()
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)

  const [recentWorkoutLogs, priorWorkoutLogs, recentMicrocycles] = await Promise.all([
    prisma.workoutLog.findMany({
      where: { userId, completedAt: { gte: twoWeeksAgo } },
      select: { overallRpe: true, workoutId: true },
    }),
    prisma.workoutLog.findMany({
      where: { userId, completedAt: { gte: fourWeeksAgo, lt: twoWeeksAgo } },
      select: { overallRpe: true },
    }),
    prisma.microcycle.findMany({
      where: {
        mesocycle: { macrocycle: { userId } },
        startDate: { lte: now },
        endDate: { gte: twoWeeksAgo },
      },
      select: {
        isRecovery: true,
        workouts: { select: { id: true } },
      },
    }),
  ])

  if (recentWorkoutLogs.length === 0) {
    return NextResponse.json(null)
  }

  // RPE trend
  const recentWithRpe = recentWorkoutLogs.filter((l) => l.overallRpe != null)
  const recentRpe =
    recentWithRpe.length > 0
      ? recentWithRpe.reduce((s, l) => s + l.overallRpe!, 0) / recentWithRpe.length
      : null

  const priorWithRpe = priorWorkoutLogs.filter((l) => l.overallRpe != null)
  const priorRpe =
    priorWithRpe.length > 0
      ? priorWithRpe.reduce((s, l) => s + l.overallRpe!, 0) / priorWithRpe.length
      : null

  const rpeDelta = recentRpe != null && priorRpe != null ? recentRpe - priorRpe : null

  // Adherence — planned workouts in recent microcycles vs completed logs for those workouts
  const plannedWorkoutIds = new Set(
    recentMicrocycles.flatMap((mc) => mc.workouts.map((w) => w.id))
  )
  const totalPlanned = recentMicrocycles.reduce((s, mc) => s + mc.workouts.length, 0)
  const completedPlanned = recentWorkoutLogs.filter(
    (l) => l.workoutId && plannedWorkoutIds.has(l.workoutId)
  ).length
  const adherencePct = totalPlanned > 0 ? (completedPlanned / totalPlanned) * 100 : null

  // Recovery credit
  const recoveryCredit = recentMicrocycles.some((mc) => mc.isRecovery)

  // Scoring
  let score = 0
  if (rpeDelta != null) {
    if (rpeDelta >= 1.0) score += 3
    else if (rpeDelta >= 0.5) score += 2
    else if (rpeDelta >= 0.25) score += 1
  }
  if (adherencePct != null && adherencePct < 70) score += 1
  if (recoveryCredit) score -= 1

  const trafficLight: 'green' | 'amber' | 'red' =
    score <= 0 ? 'green' : score <= 2 ? 'amber' : 'red'

  const explanation =
    trafficLight === 'green'
      ? 'Training load looks manageable. Keep it up!'
      : trafficLight === 'amber'
      ? 'Some fatigue detected. Monitor your performance and consider an easier session or extra rest day.'
      : 'High fatigue detected. A deload week would help you recover and come back stronger.'

  return NextResponse.json({
    trafficLight,
    rpeTrend: {
      recent: recentRpe != null ? Math.round(recentRpe * 10) / 10 : null,
      prior: priorRpe != null ? Math.round(priorRpe * 10) / 10 : null,
      delta: rpeDelta != null ? Math.round(rpeDelta * 10) / 10 : null,
    },
    adherence: {
      completed: completedPlanned,
      planned: totalPlanned,
      percentage: adherencePct != null ? Math.round(adherencePct) : null,
    },
    recoveryCredit,
    explanation,
  })
}
