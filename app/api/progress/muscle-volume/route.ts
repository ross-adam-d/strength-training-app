import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') ?? '3m'

  const now = new Date()
  let since: Date | null = null
  if (period === '4w') {
    since = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
  } else if (period === '3m') {
    since = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
  }

  const logs = await prisma.exerciseLog.findMany({
    where: {
      workoutLog: {
        userId: session.user.id,
        ...(since ? { completedAt: { gte: since } } : {}),
      },
      skipped: false,
    },
    select: {
      exercise: { select: { muscleGroups: true } },
      workoutLog: { select: { completedAt: true } },
    },
  })

  if (logs.length === 0) return NextResponse.json([])

  // Derive weeks from the earliest log in the result — never hardcode the period length.
  // Logs are already filtered by `since`, so earliest will never exceed the period boundary.
  // This correctly handles users who have less history than the selected period.
  const earliest = logs.reduce(
    (min, l) => (l.workoutLog.completedAt < min ? l.workoutLog.completedAt : min),
    logs[0].workoutLog.completedAt
  )
  const weeksInPeriod = Math.max(1, Math.round((now.getTime() - earliest.getTime()) / (7 * 24 * 60 * 60 * 1000)))

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
