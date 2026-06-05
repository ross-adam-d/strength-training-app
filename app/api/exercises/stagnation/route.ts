import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { estimate1RM } from '@/lib/progressiveOverload'

const SESSIONS_REQUIRED = 3
const LOAD_REDUCTION = 0.9

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const rawIds = searchParams.get('ids')?.split(',').filter(Boolean) ?? []
  const allMode = searchParams.get('all') === 'true'

  if (!allMode && rawIds.length === 0) return NextResponse.json({})

  let userId = (session.user as any).id as string
  const clientId = searchParams.get('clientId')
  if (clientId && (session.user as any).role === 'COACH') {
    const rel = await prisma.coachClientRelationship.findFirst({
      where: { coachId: userId, clientId, status: 'ACTIVE' },
      select: { id: true },
    })
    if (!rel) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    userId = clientId
  }

  const logs = await prisma.exerciseLog.findMany({
    where: {
      ...(rawIds.length > 0 ? { exerciseId: { in: rawIds } } : {}),
      skipped: false,
      workoutLog: { userId, completedAt: { gte: new Date('2020-01-01') } },
      OR: [{ reps: { gt: 0 } }, { repsLeft: { gt: 0 } }],
    },
    select: {
      exerciseId: true,
      weight: true,
      reps: true,
      repsLeft: true,
      workoutLogId: true,
      workoutLog: { select: { completedAt: true } },
      exercise: { select: { isBodyweight: true, name: true } },
    },
    orderBy: { workoutLog: { completedAt: 'desc' } },
  })

  // Group: exerciseId → sessionId (workoutLogId) → best metric for that session
  // Map insertion order preserves newest-first because logs are ordered by completedAt desc
  const byExercise = new Map<string, {
    name: string
    sessions: Map<string, { metric: number; weight: number; isBodyweight: boolean }>
  }>()

  for (const log of logs) {
    const effectiveReps = log.reps > 0 ? log.reps : (log.repsLeft ?? 0)
    if (effectiveReps === 0) continue

    const isBodyweight = log.exercise.isBodyweight
    // Bodyweight exercises: metric = best reps (no load to scale); weighted: metric = best e1RM
    const metric = isBodyweight
      ? effectiveReps
      : estimate1RM(log.weight, effectiveReps)
    if (metric <= 0) continue

    if (!byExercise.has(log.exerciseId)) {
      byExercise.set(log.exerciseId, { name: log.exercise.name, sessions: new Map() })
    }
    const entry = byExercise.get(log.exerciseId)!

    const existing = entry.sessions.get(log.workoutLogId)
    if (!existing || metric > existing.metric) {
      entry.sessions.set(log.workoutLogId, { metric, weight: log.weight, isBodyweight })
    }
  }

  const ids = allMode ? Array.from(byExercise.keys()) : rawIds

  const result: Record<string, {
    stagnant: boolean
    sessionsChecked: number
    currentBest: number
    suggestedLoad?: number
    isBodyweight: boolean
    exerciseName?: string
  }> = {}

  for (const id of ids) {
    const entry = byExercise.get(id)
    const sessionsChecked = entry?.sessions.size ?? 0

    if (!entry || sessionsChecked < SESSIONS_REQUIRED) {
      if (!allMode) {
        result[id] = { stagnant: false, sessionsChecked, currentBest: 0, isBodyweight: false }
      }
      continue
    }

    const sessions = Array.from(entry.sessions.values()).slice(0, SESSIONS_REQUIRED)
    const newest = sessions[0]
    const oldest = sessions[SESSIONS_REQUIRED - 1]
    const stagnant = newest.metric <= oldest.metric

    if (allMode && !stagnant) continue

    // Suggested load in kg, rounded to nearest 0.5kg
    const suggestedLoad = !newest.isBodyweight && newest.weight > 0
      ? Math.round(newest.weight * LOAD_REDUCTION * 2) / 2
      : undefined

    result[id] = {
      stagnant,
      sessionsChecked: SESSIONS_REQUIRED,
      currentBest: newest.metric,
      suggestedLoad,
      isBodyweight: newest.isBodyweight,
      ...(allMode ? { exerciseName: entry.name } : {}),
    }
  }

  return NextResponse.json(result)
}
