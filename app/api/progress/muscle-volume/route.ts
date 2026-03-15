import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function resolveUserId(session: { user: { id: string; role?: string } }, searchParams: URLSearchParams) {
  const clientId = searchParams.get('clientId')
  if (!clientId) return session.user.id
  if (session.user.role !== 'COACH') return null
  const rel = await prisma.coachClientRelationship.findFirst({
    where: { coachId: session.user.id, clientId, status: 'ACTIVE' },
    select: { id: true },
  })
  return rel ? clientId : null
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') ?? '3m'

  const userId = await resolveUserId(session.user as any, searchParams)
  if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()

  // Truncate to the end of the last fully completed calendar week (Mon–Sun).
  // If we're mid-week, the current partial week is excluded so averages aren't deflated.
  const startOfCurrentWeek = new Date(now)
  const dow = now.getDay() // 0=Sun, 1=Mon … 6=Sat
  const daysToMonday = dow === 0 ? 6 : dow - 1
  startOfCurrentWeek.setDate(now.getDate() - daysToMonday)
  startOfCurrentWeek.setHours(0, 0, 0, 0)

  let since: Date | null = null
  let phaseWorkoutFilter: { microcycle: { mesocycleId: string } } | undefined

  if (period === 'phase') {
    // Scope to current active block → active mesocycle
    const activeMeso = await prisma.mesocycle.findFirst({
      where: {
        macrocycle: { userId, status: 'active' },
        status: 'active',
      },
      orderBy: { startDate: 'desc' },
      select: { id: true, startDate: true },
    })
    if (activeMeso) {
      since = new Date(activeMeso.startDate)
      phaseWorkoutFilter = { microcycle: { mesocycleId: activeMeso.id } }
    }
    // If no active phase, fall through with no date filter (show all)
  } else if (period === '4w') {
    since = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
  } else if (period === '3m') {
    since = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
  }

  const logs = await prisma.exerciseLog.findMany({
    where: {
      workoutLog: {
        userId,
        completedAt: {
          ...(since ? { gte: since } : {}),
          // Always exclude the current partial week so mid-week averages aren't deflated
          lt: startOfCurrentWeek,
        },
        ...(phaseWorkoutFilter ? { workout: phaseWorkoutFilter } : {}),
      },
      skipped: false,
    },
    select: {
      exercise: { select: { muscleGroups: true } },
      workoutLog: { select: { completedAt: true } },
    },
  })

  if (logs.length === 0) return NextResponse.json([])

  // Derive completed weeks from the earliest log to startOfCurrentWeek.
  // Current partial week is always excluded so mid-week averages aren't deflated.
  const earliest = logs.reduce(
    (min, l) => (l.workoutLog.completedAt < min ? l.workoutLog.completedAt : min),
    logs[0].workoutLog.completedAt
  )
  const endRef = startOfCurrentWeek
  const weeksInPeriod = Math.max(1, Math.round((endRef.getTime() - earliest.getTime()) / (7 * 24 * 60 * 60 * 1000)))

  // Count sets per muscle group — each log counts once per muscle group on the exercise
  const counts: Record<string, number> = {}
  for (const log of logs) {
    for (const muscle of log.exercise.muscleGroups) {
      counts[muscle] = (counts[muscle] ?? 0) + 1
    }
  }

  const result = Object.entries(counts)
    .map(([muscleGroup, totalSets]) => ({
      muscleGroup,
      totalSets,
      avgSetsPerWeek: Math.round((totalSets / weeksInPeriod) * 10) / 10,
    }))
    .sort((a, b) => b.avgSetsPerWeek - a.avgSetsPerWeek)

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, s-maxage=300' },
  })
}
