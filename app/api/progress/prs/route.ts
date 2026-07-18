import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { estimate1RM } from '@/lib/progressiveOverload'
import { effectiveLoad, liftType, resolveBodyweight, type LiftType } from '@/lib/effectiveLoad'

async function resolveUserId(user: { id: string; role?: string }, requestUrl: string) {
  const clientId = new URL(requestUrl).searchParams.get('clientId')
  if (!clientId) return user.id
  if (user.role !== 'COACH') return null
  const rel = await prisma.coachClientRelationship.findFirst({
    where: { coachId: user.id, clientId, status: 'ACTIVE' },
    select: { id: true },
  })
  return rel ? clientId : null
}

type Agg = {
  exerciseName: string
  type: LiftType
  lastLoggedAt: Date
  est1RM: number // best effective-load 1RM (loaded + bodyweight when a reference exists)
  bestReps: number // best single-set reps (bodyweight)
  bestHold: number // best single-set duration, seconds (timed)
  sessionTUT: Map<string, number> // workoutLogId -> summed duration (timed)
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await resolveUserId(session.user as any, request.url)
  if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [logs, profile] = await Promise.all([
    prisma.exerciseLog.findMany({
      where: { workoutLog: { userId }, skipped: false },
      select: {
        exerciseId: true,
        weight: true,
        reps: true,
        repsLeft: true,
        duration: true,
        workoutLogId: true,
        exercise: { select: { name: true, isBodyweight: true, isTimed: true } },
        workoutLog: { select: { completedAt: true, bodyweight: true } },
      },
    }),
    prisma.profile.findUnique({ where: { userId }, select: { weight: true } }),
  ])

  const profileWeight = profile?.weight ?? null
  const byExercise = new Map<string, Agg>()

  for (const log of logs) {
    const type = liftType(log.exercise.isBodyweight, log.exercise.isTimed)
    const reps = log.reps > 0 ? log.reps : (log.repsLeft ?? 0)

    let agg = byExercise.get(log.exerciseId)
    if (!agg) {
      agg = {
        exerciseName: log.exercise.name,
        type,
        lastLoggedAt: log.workoutLog.completedAt,
        est1RM: 0,
        bestReps: 0,
        bestHold: 0,
        sessionTUT: new Map(),
      }
      byExercise.set(log.exerciseId, agg)
    }

    if (log.workoutLog.completedAt > agg.lastLoggedAt) agg.lastLoggedAt = log.workoutLog.completedAt

    if (type === 'timed') {
      if ((log.duration ?? 0) > agg.bestHold) agg.bestHold = log.duration ?? 0
      agg.sessionTUT.set(log.workoutLogId, (agg.sessionTUT.get(log.workoutLogId) ?? 0) + (log.duration ?? 0))
      continue
    }

    if (reps > agg.bestReps) agg.bestReps = reps

    const load = effectiveLoad(
      log.weight,
      log.exercise.isBodyweight,
      resolveBodyweight(log.workoutLog.bodyweight, profileWeight)
    )
    if (load != null && reps > 0) {
      const est = estimate1RM(load, reps)
      if (est > agg.est1RM) agg.est1RM = est
    }
  }

  const result = Array.from(byExercise.entries())
    .map(([exerciseId, a]) => {
      const bestSessionTUT = a.sessionTUT.size > 0 ? Math.max(...a.sessionTUT.values()) : 0
      return {
        exerciseId,
        exerciseName: a.exerciseName,
        type: a.type,
        est1RM: Math.round(a.est1RM),
        est5RM: Math.round(a.est1RM * (30 / 35)),
        est10RM: Math.round(a.est1RM * (30 / 40)),
        bestReps: a.bestReps,
        bestHold: a.bestHold,
        bestSessionTUT,
        lastLoggedAt: a.lastLoggedAt.toISOString(),
      }
    })
    // Loaded exercises sort by 1RM; bodyweight by reps; timed by hold — but keep a stable
    // overall order (loaded first by 1RM, then the rest) so the table reads sensibly.
    .sort((a, b) => b.est1RM - a.est1RM || b.bestReps - a.bestReps || b.bestHold - a.bestHold)

  return NextResponse.json(result, { headers: { 'Cache-Control': 'private, s-maxage=300' } })
}
