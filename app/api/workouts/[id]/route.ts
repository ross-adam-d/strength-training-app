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

    // Optimized: Use select instead of include, only fetch needed fields
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
      select: {
        id: true,
        name: true,
        description: true,
        estimatedDuration: true,
        warmupNotes: true,
        notes: true,
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
          select: {
            id: true,
            orderIndex: true,
            targetSets: true,
            targetReps: true,
            targetRpe: true,
            targetRir: true,
            tempo: true,
            restPeriod: true,
            supersetWithPrevious: true,
            notes: true,
            exercise: {
              select: {
                id: true,
                name: true,
                description: true,
                isUnilateral: true,
                isTimed: true,
                isBodyweight: true,
              },
            },
          },
        },
        workoutLogs: {
          orderBy: {
            completedAt: 'desc',
          },
          take: 1,
          select: {
            id: true,
            completedAt: true,
            exerciseLogs: {
              where: { skipped: false },
              orderBy: { setNumber: 'asc' },
              select: {
                exerciseId: true,
                setNumber: true,
                reps: true,
                repsLeft: true,
                repsRight: true,
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

    // Add cache headers (2 minutes - workouts don't change often during a session)
    return NextResponse.json(workout, {
      headers: {
        'Cache-Control': 'private, s-maxage=120, stale-while-revalidate=300',
      },
    })
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

      // Fetch current workout's exercises to clone them
      const currentExercises = await prisma.workoutExercise.findMany({
        where: { workoutId: id },
        orderBy: { orderIndex: 'asc' },
      })

      // Build transaction array (properly typed)
      const transactionOps: any[] = [
        // Update current workout
        prisma.workout.update({
          where: { id },
          data: updateData,
        }),
        // Update remaining workouts
        ...remainingWorkouts.map((w) =>
          prisma.workout.update({
            where: { id: w.id },
            data: updateData,
          })
        ),
      ]

      // For each remaining workout, delete old exercises and clone current ones
      for (const w of remainingWorkouts) {
        // Delete existing exercises for this workout
        transactionOps.push(
          prisma.workoutExercise.deleteMany({
            where: { workoutId: w.id },
          })
        )

        // Clone current exercises to this workout
        for (const ex of currentExercises) {
          transactionOps.push(
            prisma.workoutExercise.create({
              data: {
                workoutId: w.id,
                exerciseId: ex.exerciseId,
                orderIndex: ex.orderIndex,
                targetSets: ex.targetSets,
                targetReps: ex.targetReps,
                targetRpe: ex.targetRpe,
                targetRir: ex.targetRir,
                tempo: ex.tempo,
                restPeriod: ex.restPeriod,
                supersetWithPrevious: ex.supersetWithPrevious,
                notes: ex.notes,
              },
            })
          )
        }
      }

      // Execute all operations in a transaction
      await prisma.$transaction(transactionOps)

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
