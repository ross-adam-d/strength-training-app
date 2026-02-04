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
  exerciseLogs: z.array(z.object({
    exerciseId: z.string(),
    setNumber: z.number().int().positive(),
    reps: z.number().int().positive(),
    weight: z.number(),
    rpe: z.number().optional(),
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

    // Verify the workout belongs to the user (if provided)
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
      })

      if (!workout) {
        return NextResponse.json(
          { error: 'Workout not found' },
          { status: 404 }
        )
      }
    }

    // Create workout log with exercise logs
    const workoutLog = await prisma.workoutLog.create({
      data: {
        workoutId: data.workoutId || null,
        userId: session.user.id,
        duration: data.duration,
        notes: data.notes,
        overallRating: data.overallRating,
        exerciseLogs: {
          create: data.exerciseLogs.map((log) => ({
            exerciseId: log.exerciseId,
            setNumber: log.setNumber,
            reps: log.reps,
            weight: log.weight,
            rpe: log.rpe,
            notes: log.notes,
          })),
        },
      },
      include: {
        exerciseLogs: {
          include: {
            exercise: true,
          },
        },
      },
    })

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
