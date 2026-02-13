import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const workoutLogSchema = z.object({
  workoutId: z.string().optional(),
  duration: z.number().int().positive().optional(),
  notes: z.string().optional(),
  overallRating: z.number().int().min(1).max(5).optional(),
  overallRpe: z.number().optional(),
  exerciseLogs: z.array(z.object({
    exerciseId: z.string(),
    setNumber: z.number().int().positive(),
    reps: z.number().int().min(0),
    repsLeft: z.number().int().min(0).optional(),
    repsRight: z.number().int().min(0).optional(),
    weight: z.number().min(0),
    exerciseRpe: z.number().optional(),
    rir: z.number().int().min(0).optional(),
    skipped: z.boolean().optional(),
    notes: z.string().optional(),
  })),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const workoutLogs = await prisma.workoutLog.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: limit,
      include: {
        workout: {
          select: {
            name: true,
          },
        },
        exerciseLogs: {
          select: {
            exercise: {
              select: {
                name: true,
              },
            },
            weight: true,
            reps: true,
          },
        },
      },
    })

    return NextResponse.json(workoutLogs)
  } catch (error) {
    console.error('Error fetching workout logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = workoutLogSchema.parse(body)

    // Optimized: Verify ownership with minimal query
    let mesocycleId: string | null = null
    let macrocycleId: string | null = null
    if (data.workoutId) {
      const workout = await prisma.workout.findFirst({
        where: {
          id: data.workoutId,
          microcycle: {
            mesocycle: {
              macrocycle: {
                userId: session.user.id,
              },
            },
          },
        },
        select: {
          id: true,
          microcycle: {
            select: {
              mesocycle: {
                select: {
                  id: true,
                  macrocycleId: true,
                },
              },
            },
          },
        },
      })

      if (!workout) {
        return NextResponse.json(
          { error: 'Workout not found' },
          { status: 404 }
        )
      }

      mesocycleId = workout.microcycle.mesocycle.id
      macrocycleId = workout.microcycle.mesocycle.macrocycleId
    }

    // Optimized: Create workout log and update status in parallel
    // Don't return nested data - frontend redirects immediately
    const workoutLog = await prisma.workoutLog.create({
      data: {
        workoutId: data.workoutId || null,
        userId: session.user.id,
        duration: data.duration,
        notes: data.notes,
        overallRating: data.overallRating,
        overallRpe: data.overallRpe,
        exerciseLogs: {
          create: data.exerciseLogs.map((log) => ({
            exerciseId: log.exerciseId,
            setNumber: log.setNumber,
            reps: log.reps,
            repsLeft: log.repsLeft,
            repsRight: log.repsRight,
            weight: log.weight,
            exerciseRpe: log.exerciseRpe,
            rir: log.rir,
            skipped: log.skipped ?? false,
            notes: log.notes,
          })),
        },
      },
      select: {
        id: true,
        completedAt: true,
      },
    })

    // Run status updates in parallel (if needed)
    const statusUpdates = []
    if (mesocycleId) {
      statusUpdates.push(
        prisma.mesocycle.updateMany({
          where: { id: mesocycleId, status: 'planned' },
          data: { status: 'active' },
        })
      )
    }
    if (macrocycleId) {
      statusUpdates.push(
        prisma.macrocycle.updateMany({
          where: { id: macrocycleId, status: 'planned' },
          data: { status: 'active' },
        })
      )
    }

    if (statusUpdates.length > 0) {
      await Promise.all(statusUpdates)
    }

    return NextResponse.json(workoutLog, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating workout log:', error)
    return NextResponse.json(
      { error: 'Failed to create workout log' },
      { status: 500 }
    )
  }
}
