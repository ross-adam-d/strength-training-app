import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type ExerciseLogEntry = {
  exerciseId: string
  exercise: { name: string }
  weight: number
  reps: number
  repsLeft: number | null
  repsRight: number | null
}

function groupByExercise(logs: ExerciseLogEntry[]) {
  const groups = new Map<string, { name: string; volume: number; maxWeight: number }>()
  for (const log of logs) {
    const reps = log.reps || (log.repsLeft ?? 0) + (log.repsRight ?? 0)
    const vol = log.weight * reps
    const existing = groups.get(log.exerciseId)
    if (existing) {
      existing.volume += vol
      if (log.weight > existing.maxWeight) existing.maxWeight = log.weight
    } else {
      groups.set(log.exerciseId, { name: log.exercise.name, volume: vol, maxWeight: log.weight })
    }
  }
  return groups
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const now = new Date()
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)

  const EXERCISE_LOG_SELECT = {
    where: { skipped: false, weight: { gt: 0 } },
    select: {
      exerciseId: true,
      exercise: { select: { name: true } },
      weight: true,
      reps: true,
      repsLeft: true,
      repsRight: true,
    },
  } as const

  const [recentWorkoutLogs, priorWorkoutLogs, recentMicrocycles, recentExerciseLogs, priorExerciseLogs] = await Promise.all([
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
    prisma.exerciseLog.findMany({
      where: { workoutLog: { userId, completedAt: { gte: twoWeeksAgo } }, skipped: false, weight: { gt: 0 } },
      select: { exerciseId: true, exercise: { select: { name: true } }, weight: true, reps: true, repsLeft: true, repsRight: true },
    }),
    prisma.exerciseLog.findMany({
      where: { workoutLog: { userId, completedAt: { gte: fourWeeksAgo, lt: twoWeeksAgo } }, skipped: false, weight: { gt: 0 } },
      select: { exerciseId: true, exercise: { select: { name: true } }, weight: true, reps: true, repsLeft: true, repsRight: true },
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

  // Progression signal — compare exercise performance between periods
  const recentByEx = groupByExercise(recentExerciseLogs)
  const priorByEx = groupByExercise(priorExerciseLogs)

  type HighlightDir = 'up' | 'down'
  const highlights: { exerciseName: string; change: string; direction: HighlightDir }[] = []
  let improving = 0, declining = 0, commonCount = 0

  for (const [id, recent] of recentByEx) {
    const prior = priorByEx.get(id)
    if (!prior) continue
    commonCount++
    const weightChange = recent.maxWeight - prior.maxWeight
    const volPct = prior.volume > 0 ? (recent.volume - prior.volume) / prior.volume : 0
    if (weightChange > 0) {
      improving++
      highlights.push({ exerciseName: recent.name, change: `+${weightChange}kg`, direction: 'up' })
    } else if (weightChange < 0 && volPct < -0.05) {
      declining++
      highlights.push({ exerciseName: recent.name, change: `${weightChange}kg`, direction: 'down' })
    } else if (volPct > 0.1) {
      improving++
      highlights.push({ exerciseName: recent.name, change: `+${Math.round(volPct * 100)}% vol`, direction: 'up' })
    } else if (volPct < -0.15) {
      declining++
    } else {
      improving++ // stable is counted as not declining
    }
  }

  const progressionTrend: 'improving' | 'stable' | 'declining' | null =
    commonCount < 2 ? null :
    declining / commonCount > 0.5 ? 'declining' :
    improving / commonCount > 0.5 ? 'improving' : 'stable'

  // Top highlights — up first, capped at 3
  const topHighlights = highlights
    .sort((a, b) => (a.direction === 'up' ? -1 : 1) - (b.direction === 'up' ? -1 : 1))
    .slice(0, 3)

  // Scoring
  let score = 0
  if (rpeDelta != null) {
    if (rpeDelta >= 1.0) score += 3
    else if (rpeDelta >= 0.5) score += 2
    else if (rpeDelta >= 0.25) score += 1
    // High RPE + improving lifts → adaptation, reduce alarm
    if (rpeDelta >= 0.5 && progressionTrend === 'improving') score -= 1
  }
  if (adherencePct != null && adherencePct < 70) score += 1
  if (recoveryCredit) score -= 1
  // Declining lifts + rising RPE → extra fatigue signal
  if (progressionTrend === 'declining' && rpeDelta != null && rpeDelta >= 0.25) score += 1

  const trafficLight: 'green' | 'amber' | 'red' =
    score <= 0 ? 'green' : score <= 2 ? 'amber' : 'red'

  function buildExplanation() {
    if (trafficLight === 'green') {
      if (progressionTrend === 'improving') return 'Training load is manageable and your lifts are progressing. Keep it up!'
      return 'Training load looks manageable. Keep it up!'
    }
    if (trafficLight === 'amber') {
      if (progressionTrend === 'improving') return 'RPE is rising but your lifts are still progressing — classic adaptation. Keep monitoring.'
      if (progressionTrend === 'declining') return 'Fatigue detected and performance is slipping. Consider reducing intensity or taking an extra rest day.'
      return 'Some fatigue detected. Monitor your performance and consider an easier session or extra rest day.'
    }
    if (progressionTrend === 'declining') return 'High fatigue and declining performance. A deload week would help you recover and come back stronger.'
    if (progressionTrend === 'improving') return 'RPE is high but lifts are still improving. Ensure you\'re sleeping and eating enough to support the load.'
    return 'High fatigue detected. A deload week would help you recover and come back stronger.'
  }

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
    progressionTrend,
    highlights: topHighlights,
    explanation: buildExplanation(),
  })
}
