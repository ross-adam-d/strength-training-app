import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workout = await prisma.workout.findFirst({
      where: {
        id,
        microcycle: {
          mesocycle: {
            macrocycle: {
              userId: session.user.id,
            },
          },
        },
      },
      include: {
        microcycle: {
          select: {
            id: true,
            name: true,
            mesocycle: {
              select: {
                id: true,
                name: true,
                warmupNotes: true,
                macrocycle: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        workoutExercises: {
          orderBy: {
            orderIndex: 'asc',
          },
          include: {
            exercise: true,
          },
        },
        workoutLogs: {
          orderBy: {
            completedAt: 'desc',
          },
          take: 1,
          include: {
            exerciseLogs: {
              where: { skipped: false },
              orderBy: { setNumber: 'asc' },
              select: {
                exerciseId: true,
                setNumber: true,
                reps: true,
                weight: true,
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

    return NextResponse.json(workout)
  } catch (error) {
    console.error('Error fetching workout:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, dayOfWeek, estimatedDuration, warmupNotes, applyToRestOfPhase } = body

    // Verify ownership before updating
    const workout = await prisma.workout.findFirst({
      where: {
        id,
        microcycle: {
          mesocycle: {
            macrocycle: {
              userId: session.user.id,
            },
          },
        },
      },
      include: {
        microcycle: {
          include: {
            mesocycle: {
              include: {
                microcycles: {
                  include: {
                    workouts: true,
                  },
                  orderBy: {
                    weekNumber: 'asc',
                  },
                },
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

    // Build update data object
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (dayOfWeek !== undefined) {
      updateData.dayOfWeek = dayOfWeek === -1 || dayOfWeek === null ? null : parseInt(dayOfWeek)
    }
    if (estimatedDuration !== undefined) updateData.estimatedDuration = estimatedDuration
    if (warmupNotes !== undefined) updateData.warmupNotes = warmupNotes

    // If applyToRestOfPhase is true, update all matching workouts in remaining weeks
    if (applyToRestOfPhase && name) {
      const currentWeekNumber = workout.microcycle.weekNumber
      const originalName = workout.name

      // Find all workouts with the same name in remaining weeks
      const remainingWorkouts = workout.microcycle.mesocycle.microcycles
        .filter((mic) => mic.weekNumber > currentWeekNumber)
        .flatMap((mic) => mic.workouts)
        .filter((w) => w.name === originalName)

      // Update current workout + all remaining workouts
      await prisma.$transaction([
        prisma.workout.update({
          where: { id },
          data: updateData,
        }),
        ...remainingWorkouts.map((w) =>
          prisma.workout.update({
            where: { id: w.id },
            data: updateData,
          })
        ),
      ])

      return NextResponse.json({ success: true, updatedCount: remainingWorkouts.length + 1 })
    } else {
      // Update only this workout
      const updated = await prisma.workout.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json(updated)
    }
  } catch (error) {
    console.error('Error updating workout:', error)
    return NextResponse.json(
      { error: 'Failed to update workout' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deleted = await prisma.workout.deleteMany({
      where: {
        id,
        microcycle: {
          mesocycle: {
            macrocycle: {
              userId: session.user.id,
            },
          },
        },
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json(
      { error: 'Failed to delete workout' },
      { status: 500 }
    )
  }
}
