import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachBlockAccess } from '@/lib/coachAccess'

/** Returns true if coachId created the block containing this workout with an active client relationship */
async function verifyCoachWorkoutAccess(coachId: string, workoutId: string): Promise<boolean> {
  const w = await prisma.workout.findFirst({
    where: { id: workoutId },
    select: { microcycle: { select: { mesocycle: { select: { macrocycle: { select: { id: true } } } } } } },
  })
  const macrocycleId = w?.microcycle?.mesocycle?.macrocycle?.id
  if (!macrocycleId) return false
  return verifyCoachBlockAccess(coachId, macrocycleId)
}

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

    // Try user ownership; fall back to coach access
    let getWhere: any = { id, microcycle: { mesocycle: { macrocycle: { userId: session.user.id } } } }
    if (session.user.role === 'COACH') {
      const coachAccess = await verifyCoachWorkoutAccess(session.user.id, id)
      if (coachAccess) getWhere = { id }
    }

    // Optimized: Use select instead of include, only fetch needed fields
    const workout = await prisma.workout.findFirst({
      where: getWhere,
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
                    userId: true,
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
                equipment: true,
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

    // Fetch the most recent exercise log per exercise (across all weeks/workouts for this user)
    // so progressive overload suggestions work from week 2 onwards, not just for repeat completions.
    const exerciseIds = workout.workoutExercises.map((we) => we.exercise.id)

    // Use block owner's userId for logs lookup (handles both regular users and coach-viewed blocks)
    const blockOwnerUserId = workout.microcycle.mesocycle.macrocycle.userId ?? session.user.id

    const allRecentLogs = await prisma.exerciseLog.findMany({
      where: {
        exerciseId: { in: exerciseIds },
        skipped: false,
        workoutLog: {
          workout: {
            microcycle: {
              mesocycle: {
                macrocycle: { userId: blockOwnerUserId },
              },
            },
          },
        },
      },
      orderBy: [
        { workoutLog: { completedAt: 'desc' } },
        { setNumber: 'asc' },
      ],
      select: {
        exerciseId: true,
        setNumber: true,
        weight: true,
        reps: true,
        repsLeft: true,
        repsRight: true,
        rir: true,
        duration: true,
        notes: true,
        exerciseRpe: true,
        workoutLog: { select: { completedAt: true } },
      },
    })

    // Keep only the most recent session per exercise (first batch due to DESC ordering)
    const latestDateByExercise = new Map<string, number>()
    const recentExerciseLogs: Array<{
      exerciseId: string
      setNumber: number
      weight: number | null
      reps: number | null
      repsLeft: number | null
      repsRight: number | null
      rir: number | null
      duration: number | null
      notes: string | null
      exerciseRpe: number | null
    }> = []

    for (const log of allRecentLogs) {
      const completedAt = log.workoutLog.completedAt?.getTime()
      if (!completedAt) continue
      const existing = latestDateByExercise.get(log.exerciseId)
      if (existing === undefined) {
        latestDateByExercise.set(log.exerciseId, completedAt)
        const { workoutLog: _wl, ...rest } = log
        recentExerciseLogs.push(rest)
      } else if (completedAt === existing) {
        const { workoutLog: _wl, ...rest } = log
        recentExerciseLogs.push(rest)
      }
      // Older session — skip
    }

    // Add cache headers (2 minutes - workouts don't change often during a session)
    return NextResponse.json({ ...workout, recentExerciseLogs }, {
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

    // Verify ownership before updating (user or coach creator)
    let patchWhere: any = { id, microcycle: { mesocycle: { macrocycle: { userId: session.user.id } } } }
    if (session.user.role === 'COACH') {
      const coachAccess = await verifyCoachWorkoutAccess(session.user.id, id)
      if (coachAccess) patchWhere = { id }
    }

    const workout = await prisma.workout.findFirst({
      where: patchWhere,
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

    let deleteWhere: any = { id, microcycle: { mesocycle: { macrocycle: { userId: session.user.id } } } }
    if (session.user.role === 'COACH') {
      const coachAccess = await verifyCoachWorkoutAccess(session.user.id, id)
      if (coachAccess) deleteWhere = { id }
    }

    const deleted = await prisma.workout.deleteMany({
      where: deleteWhere,
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
