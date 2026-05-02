import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MIN_LOGS_FOR_READINESS = 10

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

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Resolve target user — support coach viewing a client's data
  const clientId = new URL(request.url).searchParams.get('clientId')
  let userId = session.user.id
  if (clientId) {
    if ((session.user as any).role !== 'COACH') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const rel = await prisma.coachClientRelationship.findFirst({
      where: { coachId: session.user.id, clientId, status: 'ACTIVE' },
      select: { id: true },
    })
    if (!rel) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    userId = clientId
  }
  const now = new Date()
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
  const sixWeeksAgo = new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000)

  // Must have at least MIN_LOGS_FOR_READINESS total logs before showing readiness data
  const totalLogCount = await prisma.workoutLog.count({ where: { userId } })
  if (totalLogCount < MIN_LOGS_FOR_READINESS) return NextResponse.json(null)

  // Find current active block → active mesocycle → current microcycle (for adherence scoping)
  const currentMicro = await prisma.microcycle.findFirst({
    where: {
      mesocycle: {
        macrocycle: { userId, status: 'active' },
        status: 'active',
      },
      startDate: { lte: now },
      endDate: { gte: now },
    },
    select: {
      id: true,
      isRecovery: true,
      mesocycleId: true,
      workouts: { select: { id: true } },
    },
  })

  // Fallback: earliest started microcycle in active block with any incomplete workouts
  const fallbackMicro = !currentMicro
    ? await prisma.microcycle.findFirst({
        where: {
          mesocycle: {
            macrocycle: { userId, status: 'active' },
            status: 'active',
          },
          startDate: { lte: now },
          workouts: { some: { workoutLogs: { none: {} } } },
        },
        orderBy: { weekNumber: 'asc' },
        select: {
          id: true,
          isRecovery: true,
          mesocycleId: true,
          workouts: { select: { id: true } },
        },
      })
    : null

  const activeMicro = currentMicro ?? fallbackMicro

  const exerciseLogSelect = {
    exerciseId: true,
    exercise: { select: { name: true } },
    weight: true,
    reps: true,
    repsLeft: true,
    repsRight: true,
  } as const

  // Scope exercise progression to current phase when possible, else rolling date window
  const recentExerciseWhere = activeMicro?.mesocycleId
    ? { workoutLog: { userId, completedAt: { gte: twoWeeksAgo }, workout: { microcycle: { mesocycleId: activeMicro.mesocycleId } } }, skipped: false, weight: { gt: 0 } }
    : { workoutLog: { userId, completedAt: { gte: twoWeeksAgo } }, skipped: false, weight: { gt: 0 } }

  const priorExerciseWhere = activeMicro?.mesocycleId
    ? { workoutLog: { userId, completedAt: { gte: fourWeeksAgo, lt: twoWeeksAgo }, workout: { microcycle: { mesocycleId: activeMicro.mesocycleId } } }, skipped: false, weight: { gt: 0 } }
    : { workoutLog: { userId, completedAt: { gte: fourWeeksAgo, lt: twoWeeksAgo } }, skipped: false, weight: { gt: 0 } }

  const [recentWorkoutLogs, priorWorkoutLogs, oldestWorkoutLogs, recentExerciseLogs, priorExerciseLogs, phaseMicros, recentWellnessLogs] =
    await Promise.all([
      // Recent 2 weeks of logs for RPE trending
      prisma.workoutLog.findMany({
        where: { userId, completedAt: { gte: twoWeeksAgo } },
        select: { overallRpe: true, workoutId: true },
      }),
      // Prior 2 weeks for RPE comparison
      prisma.workoutLog.findMany({
        where: { userId, completedAt: { gte: fourWeeksAgo, lt: twoWeeksAgo } },
        select: { overallRpe: true },
      }),
      // Oldest 2 weeks (4-6 weeks ago) for RPE slope
      prisma.workoutLog.findMany({
        where: { userId, completedAt: { gte: sixWeeksAgo, lt: fourWeeksAgo } },
        select: { overallRpe: true },
      }),
      // Exercise logs — recent 2-week rolling window, scoped to current phase
      prisma.exerciseLog.findMany({
        where: recentExerciseWhere,
        select: exerciseLogSelect,
      }),
      // Exercise logs — prior 2-week window for progression comparison
      prisma.exerciseLog.findMany({
        where: priorExerciseWhere,
        select: exerciseLogSelect,
      }),
      // Completed microcycles in the active phase (for adherence — exclude current week's unfinished workouts)
      activeMicro?.mesocycleId
        ? prisma.microcycle.findMany({
            where: {
              mesocycleId: activeMicro.mesocycleId,
              startDate: { lte: now },
              endDate: { lt: now },
            },
            select: { workouts: { select: { id: true } } },
          })
        : Promise.resolve([]),
      // Recent wellness scores (past 4 weeks)
      prisma.workoutLog.findMany({
        where: { userId, completedAt: { gte: fourWeeksAgo }, preWorkoutWellness: { not: null } },
        select: { preWorkoutWellness: true },
      }),
    ])

  if (recentWorkoutLogs.length === 0) {
    return NextResponse.json(null)
  }

  // RPE trend (rolling 2-week windows)
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

  const oldestWithRpe = oldestWorkoutLogs.filter((l) => l.overallRpe != null)
  const oldestRpe =
    oldestWithRpe.length > 0
      ? oldestWithRpe.reduce((s, l) => s + l.overallRpe!, 0) / oldestWithRpe.length
      : null

  const rpeDelta = recentRpe != null && priorRpe != null ? recentRpe - priorRpe : null

  // Adherence — completed microcycles only (current week excluded since it's still in progress)
  let adherencePct: number | null = null
  let completedPlanned = 0
  let totalPlanned = 0

  const phaseWorkoutIds = (phaseMicros as Array<{ workouts: { id: string }[] }>)
    .flatMap((m) => m.workouts.map((w) => w.id))
  totalPlanned = phaseWorkoutIds.length
  if (totalPlanned > 0) {
    completedPlanned = await prisma.workoutLog.count({
      where: { userId, workoutId: { in: phaseWorkoutIds } },
    })
    adherencePct = (completedPlanned / totalPlanned) * 100
  }

  // Recovery credit — is the current microcycle a recovery/deload week?
  const recoveryCredit = activeMicro?.isRecovery ?? false

  // Progression signal — compare exercise performance between rolling 2-week windows
  const recentByEx = groupByExercise(recentExerciseLogs)
  const priorByEx = groupByExercise(priorExerciseLogs)

  type HighlightDir = 'up' | 'down'
  const highlights: { exerciseName: string; change: string; direction: HighlightDir }[] = []
  let improving = 0, declining = 0, stalling = 0, commonCount = 0

  for (const [id, recent] of recentByEx) {
    const prior = priorByEx.get(id)
    if (!prior) continue
    commonCount++
    const weightChange = recent.maxWeight - prior.maxWeight
    const volPct = prior.volume > 0 ? (recent.volume - prior.volume) / prior.volume : 0

    if (weightChange > 0) {
      // Weight increased — improving
      improving++
      highlights.push({ exerciseName: recent.name, change: `+${weightChange}kg`, direction: 'up' })
    } else if (weightChange < 0) {
      // Weight dropped — declining (regardless of volume)
      declining++
      highlights.push({ exerciseName: recent.name, change: `${weightChange}kg`, direction: 'down' })
    } else if (volPct > 0.1) {
      // Weight same, volume up >10% — improving
      improving++
      highlights.push({ exerciseName: recent.name, change: `+${Math.round(volPct * 100)}% vol`, direction: 'up' })
    } else if (volPct < -0.05) {
      // Weight same, volume down >5% — declining
      declining++
    } else {
      // Weight same, volume between -5% and +10% — stalling
      stalling++
    }
  }

  const progressionTrend: 'improving' | 'stable' | 'stalling' | 'declining' | null =
    commonCount < 2 ? null :
    declining / commonCount > 0.35 ? 'declining' :
    stalling / commonCount > 0.5 ? 'stalling' :
    improving / commonCount > 0.5 ? 'improving' : 'stable'

  // Top highlights — up first, capped at 3
  const topHighlights = highlights
    .sort((a, b) => (a.direction === 'up' ? -1 : 1) - (b.direction === 'up' ? -1 : 1))
    .slice(0, 3)

  // Wellness — average of recent pre-workout wellness scores
  const wellnessValues = recentWellnessLogs.map(l => l.preWorkoutWellness!).filter(v => v != null)
  const avgWellness = wellnessValues.length > 0
    ? wellnessValues.reduce((s, v) => s + v, 0) / wellnessValues.length
    : null

  // Scoring
  let score = 0

  // RPE delta (existing)
  if (rpeDelta != null) {
    if (rpeDelta >= 1.0) score += 3
    else if (rpeDelta >= 0.5) score += 2
    else if (rpeDelta >= 0.25) score += 1
    if (rpeDelta >= 0.5 && progressionTrend === 'improving') score -= 1
  }

  // Absolute RPE (new)
  if (recentRpe != null) {
    if (recentRpe >= 4.5) score += 2
    else if (recentRpe >= 4.0) score += 1
  }

  // RPE slope — monotonic increase across 3 windows (new)
  if (oldestRpe != null && priorRpe != null && recentRpe != null) {
    if (recentRpe > priorRpe && priorRpe > oldestRpe) score += 1
  }

  // Adherence (existing)
  if (adherencePct != null && adherencePct < 70) score += 1

  // Recovery credit (existing)
  if (recoveryCredit) score -= 1

  // Declining performance (strengthened — no longer requires rising RPE)
  if (progressionTrend === 'declining') score += 2
  // Declining + rising RPE is an even stronger signal
  if (progressionTrend === 'declining' && rpeDelta != null && rpeDelta >= 0.25) score += 1

  // Stalling lifts (new)
  if (progressionTrend === 'stalling') score += 1

  // Wellness (new)
  if (avgWellness != null) {
    if (avgWellness <= 2.0) score += 2
    else if (avgWellness <= 3.0) score += 1
  }

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
      if (progressionTrend === 'stalling') return 'Progress has stalled across several lifts. Consider adjusting volume or intensity.'
      return 'Some fatigue detected. Monitor your performance and consider an easier session or extra rest day.'
    }
    if (progressionTrend === 'declining') return 'High fatigue and declining performance. A deload week would help you recover and come back stronger.'
    if (progressionTrend === 'stalling') return 'Lifts have stalled and fatigue indicators are high. A deload or program change is recommended.'
    if (progressionTrend === 'improving') return 'RPE is high but lifts are still improving. Ensure you\'re sleeping and eating enough to support the load.'
    return 'High fatigue detected. A deload week would help you recover and come back stronger.'
  }

  return NextResponse.json({
    trafficLight,
    rpeTrend: {
      recent: recentRpe != null ? Math.round(recentRpe * 10) / 10 : null,
      prior: priorRpe != null ? Math.round(priorRpe * 10) / 10 : null,
      oldest: oldestRpe != null ? Math.round(oldestRpe * 10) / 10 : null,
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
    wellness: {
      average: avgWellness != null ? Math.round(avgWellness * 10) / 10 : null,
      count: wellnessValues.length,
    },
    explanation: buildExplanation(),
  })
}
