import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type ComparisonItem = {
  id: string
  name: string
  label: string
  subtitle?: string
  sessionsCompleted: number
  totalVolumeKg: number
  weeklyAvgVolumeKg: number
  avgWorkoutRpe: number | null
  status: string
}

type LogEntry = {
  overallRpe: number | null
  exerciseLogs: Array<{ weight: number; reps: number; repsLeft: number | null; repsRight: number | null }>
}

function computeStats(allLogs: LogEntry[]) {
  const sessionsCompleted = allLogs.length
  const totalVolumeKg = allLogs.reduce((sum, log) => {
    return (
      sum +
      log.exerciseLogs.reduce((exSum, ex) => {
        const reps = ex.reps || (ex.repsLeft || 0) + (ex.repsRight || 0)
        return exSum + ex.weight * reps
      }, 0)
    )
  }, 0)
  const logsWithRpe = allLogs.filter((l) => l.overallRpe !== null)
  const avgWorkoutRpe =
    logsWithRpe.length > 0
      ? Math.round(
          (logsWithRpe.reduce((sum, l) => sum + (l.overallRpe || 0), 0) / logsWithRpe.length) * 10
        ) / 10
      : null
  return { sessionsCompleted, totalVolumeKg, avgWorkoutRpe }
}

function weeksBetween(start: Date, end: Date) {
  return Math.max(
    1,
    Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
  )
}

const EXERCISE_LOG_SELECT = {
  where: { skipped: false },
  select: { weight: true, reps: true, repsLeft: true, repsRight: true },
} as const

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'blocks'
    const now = new Date()

    // ── Weeks in active/latest phase ───────────────────────────────────────
    if (type === 'weeks') {
      const activeMeso = await prisma.mesocycle.findFirst({
        where: { macrocycle: { userId: session.user.id }, status: 'active' },
        orderBy: { startDate: 'desc' },
        select: { id: true },
      })

      const targetId =
        activeMeso?.id ??
        (
          await prisma.mesocycle.findFirst({
            where: { macrocycle: { userId: session.user.id } },
            orderBy: { startDate: 'desc' },
            select: { id: true },
          })
        )?.id

      if (!targetId) return NextResponse.json([])

      const meso = await prisma.mesocycle.findUnique({
        where: { id: targetId },
        select: {
          name: true,
          microcycles: {
            orderBy: { weekNumber: 'asc' },
            select: {
              id: true,
              weekNumber: true,
              startDate: true,
              endDate: true,
              workouts: {
                select: {
                  workoutLogs: {
                    select: {
                      overallRpe: true,
                      exerciseLogs: EXERCISE_LOG_SELECT,
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!meso) return NextResponse.json([])

      const result: ComparisonItem[] = meso.microcycles.map((micro) => {
        const allLogs = micro.workouts.flatMap((w) => w.workoutLogs)
        const { sessionsCompleted, totalVolumeKg, avgWorkoutRpe } = computeStats(allLogs)
        const start = new Date(micro.startDate)
        const end = new Date(micro.endDate)
        const status = end < now ? 'completed' : start <= now ? 'active' : 'planned'
        return {
          id: micro.id,
          name: `Week ${micro.weekNumber}`,
          label: `W${micro.weekNumber}`,
          subtitle: meso.name,
          sessionsCompleted,
          totalVolumeKg: Math.round(totalVolumeKg),
          weeklyAvgVolumeKg: Math.round(totalVolumeKg),
          avgWorkoutRpe,
          status,
        }
      })

      return NextResponse.json(result)
    }

    // ── Phase vs Phase ──────────────────────────────────────────────────────
    if (type === 'phases') {
      const macrocycles = await prisma.macrocycle.findMany({
        where: { userId: session.user.id },
        orderBy: { startDate: 'asc' },
        select: {
          name: true,
          mesocycles: {
            orderBy: { startDate: 'asc' },
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              status: true,
              microcycles: {
                select: {
                  workouts: {
                    select: {
                      workoutLogs: {
                        select: {
                          overallRpe: true,
                          exerciseLogs: EXERCISE_LOG_SELECT,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      const result: ComparisonItem[] = macrocycles.flatMap((macro) =>
        macro.mesocycles.map((meso) => {
          const allLogs = meso.microcycles
            .flatMap((micro) => micro.workouts)
            .flatMap((w) => w.workoutLogs)
          const { sessionsCompleted, totalVolumeKg, avgWorkoutRpe } = computeStats(allLogs)
          const effectiveEnd = meso.status === 'active' ? new Date(Math.min(now.getTime(), new Date(meso.endDate).getTime())) : new Date(meso.endDate)
          const wk = weeksBetween(new Date(meso.startDate), effectiveEnd)
          return {
            id: meso.id,
            name: meso.name,
            label: meso.name,
            subtitle: macro.name,
            sessionsCompleted,
            totalVolumeKg: Math.round(totalVolumeKg),
            weeklyAvgVolumeKg: Math.round(totalVolumeKg / wk),
            avgWorkoutRpe,
            status: meso.status,
          }
        })
      )

      return NextResponse.json(result)
    }

    // ── Block vs Block (default) ────────────────────────────────────────────
    const macrocycles = await prisma.macrocycle.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
        mesocycles: {
          select: {
            microcycles: {
              select: {
                workouts: {
                  select: {
                    workoutLogs: {
                      select: {
                        overallRpe: true,
                        exerciseLogs: EXERCISE_LOG_SELECT,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    const result: ComparisonItem[] = macrocycles.map((macro) => {
      const allLogs = macro.mesocycles
        .flatMap((meso) => meso.microcycles)
        .flatMap((micro) => micro.workouts)
        .flatMap((w) => w.workoutLogs)
      const { sessionsCompleted, totalVolumeKg, avgWorkoutRpe } = computeStats(allLogs)
      const effectiveEnd = macro.status === 'active' ? new Date(Math.min(now.getTime(), new Date(macro.endDate).getTime())) : new Date(macro.endDate)
      const wk = weeksBetween(new Date(macro.startDate), effectiveEnd)
      return {
        id: macro.id,
        name: macro.name,
        label: macro.name,
        sessionsCompleted,
        totalVolumeKg: Math.round(totalVolumeKg),
        weeklyAvgVolumeKg: Math.round(totalVolumeKg / wk),
        avgWorkoutRpe,
        status: macro.status,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching block comparison:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
