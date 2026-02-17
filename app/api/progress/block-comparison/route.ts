import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
                        id: true,
                        completedAt: true,
                        duration: true,
                        overallRpe: true,
                        exerciseLogs: {
                          where: { skipped: false },
                          select: {
                            weight: true,
                            reps: true,
                            repsLeft: true,
                            repsRight: true,
                          },
                        },
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

    const result = macrocycles.map((macro) => {
      // Flatten all workout logs across all phases/weeks
      const allLogs = macro.mesocycles
        .flatMap((meso) => meso.microcycles)
        .flatMap((micro) => micro.workouts)
        .flatMap((workout) => workout.workoutLogs)

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
          ? logsWithRpe.reduce((sum, l) => sum + (l.overallRpe || 0), 0) / logsWithRpe.length
          : null

      const totalDurationMins = allLogs.reduce((sum, l) => sum + (l.duration || 0), 0)

      const start = new Date(macro.startDate)
      const end = new Date(macro.endDate)
      const weekCount = Math.max(
        1,
        Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
      )

      return {
        id: macro.id,
        name: macro.name,
        startDate: macro.startDate,
        endDate: macro.endDate,
        status: macro.status,
        weekCount,
        sessionsCompleted,
        totalVolumeKg: Math.round(totalVolumeKg),
        weeklyAvgVolumeKg: Math.round(totalVolumeKg / weekCount),
        avgWorkoutRpe: avgWorkoutRpe !== null ? Math.round(avgWorkoutRpe * 10) / 10 : null,
        totalDurationMins,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching block comparison:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
