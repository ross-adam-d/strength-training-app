import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

function escapeCsvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    const tier = token?.tier ?? 'PREMIERE'
    if (tier === 'BASIC') {
      return NextResponse.json(
        { error: 'CSV export is an Elite feature. Upgrade to access data export.' },
        { status: 403 }
      )
    }

    const logs = await prisma.workoutLog.findMany({
      where: { userId: session.user.id },
      orderBy: { completedAt: 'asc' },
      include: {
        workout: {
          select: {
            name: true,
            microcycle: {
              select: {
                weekNumber: true,
                mesocycle: {
                  select: {
                    name: true,
                    macrocycle: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
        exerciseLogs: {
          orderBy: [{ exerciseId: 'asc' }, { setNumber: 'asc' }],
          include: {
            exercise: {
              select: { name: true, muscleGroups: true },
            },
          },
        },
      },
    })

    const headers = [
      'Date',
      'Block',
      'Phase',
      'Week',
      'Workout',
      'Exercise',
      'Muscle Groups',
      'Set',
      'Weight (kg)',
      'Reps',
      'Reps Left',
      'Reps Right',
      'RIR',
      'RPE',
      'Duration (s)',
      'Skipped',
      'Notes',
    ]

    const rows: string[] = [headers.join(',')]

    for (const log of logs) {
      const date = log.completedAt.toISOString().slice(0, 10)
      const block = log.workout?.microcycle?.mesocycle?.macrocycle?.name ?? ''
      const phase = log.workout?.microcycle?.mesocycle?.name ?? ''
      const week = log.workout?.microcycle?.weekNumber ?? ''
      const workoutName = log.workout?.name ?? 'Manual Workout'

      if (log.exerciseLogs.length === 0) {
        // Workout with no exercise logs — emit one row with blanks for exercise fields
        rows.push(
          [date, block, phase, week, workoutName, '', '', '', '', '', '', '', '', '', '', '', '']
            .map(escapeCsvField)
            .join(',')
        )
        continue
      }

      for (const el of log.exerciseLogs) {
        const row = [
          date,
          block,
          phase,
          week,
          workoutName,
          el.exercise.name,
          el.exercise.muscleGroups.join(', '),
          el.setNumber,
          el.weight,
          el.reps,
          el.repsLeft,
          el.repsRight,
          el.rir,
          el.exerciseRpe,
          el.duration,
          el.skipped,
          el.notes,
        ]
        rows.push(row.map(escapeCsvField).join(','))
      }
    }

    const csvString = rows.join('\n')
    const today = new Date().toISOString().slice(0, 10)

    return new Response(csvString, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="problock-export-${today}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting workout logs:', error)
    return NextResponse.json({ error: 'Failed to export workout logs' }, { status: 500 })
  }
}
