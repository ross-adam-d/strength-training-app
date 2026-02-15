import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getWorkoutType, getDaysOfWeek } from '@/lib/splitTemplates'

// Map UI training split names to split keys
function getSplitWorkoutTypes(trainingSplit: string): string[] {
  const splitMap: Record<string, string[]> = {
    'Full Body': ['Full Body'],
    'Upper/Lower': ['Upper', 'Lower'],
    'Push/Pull/Legs': ['Push', 'Pull', 'Legs'],
    'Bro Split': ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms'],
    'Custom': ['Full Body'], // Default to Full Body for custom
  }

  return splitMap[trainingSplit] || ['Full Body']
}

export async function POST(
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
    const { mode } = body // 'default' or 'manual'

    // Fetch mesocycle with ownership verification
    const mesocycle = await prisma.mesocycle.findFirst({
      where: {
        id,
        macrocycle: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        trainingDaysPerWeek: true,
        trainingSplit: true,
        microcycles: {
          orderBy: {
            weekNumber: 'asc',
          },
          select: {
            id: true,
            weekNumber: true,
          },
        },
      },
    })

    if (!mesocycle) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    if (!mesocycle.trainingDaysPerWeek || !mesocycle.trainingSplit) {
      return NextResponse.json(
        { error: 'Please set training days and split for this phase first' },
        { status: 400 }
      )
    }

    // Get workout types based on split
    const workoutTypeNames = getSplitWorkoutTypes(mesocycle.trainingSplit)
    const daysOfWeek = getDaysOfWeek(mesocycle.trainingDaysPerWeek)

    // Create workout rotation
    const rotation = daysOfWeek.map((_: number, i: number) =>
      workoutTypeNames[i % workoutTypeNames.length]
    )

    // Fetch all exercises to resolve names to IDs
    const exercises = await prisma.exercise.findMany({
      where: {
        OR: [
          { isPublic: true },
          { createdById: session.user.id },
        ],
      },
      select: {
        id: true,
        name: true,
      },
    })
    const exerciseMap = new Map(exercises.map((e) => [e.name, e.id]))

    // Create workouts for each week
    for (const microcycle of mesocycle.microcycles) {
      for (let i = 0; i < daysOfWeek.length; i++) {
        const dayOfWeek = daysOfWeek[i]
        const workoutTypeName = rotation[i]

        // Create workout
        const workoutData: any = {
          name: workoutTypeName,
          dayOfWeek,
          microcycleId: microcycle.id,
          orderIndex: i,
        }

        // If mode is 'default', add exercises
        if (mode === 'default') {
          const workoutType = getWorkoutType(workoutTypeName)

          if (workoutType) {
            const exerciseSlots = workoutType.slots.map((slot, slotIdx) => {
              const exerciseId = exerciseMap.get(slot.exerciseName)
              if (!exerciseId) {
                throw new Error(`Exercise not found: "${slot.exerciseName}"`)
              }

              return {
                exerciseId,
                orderIndex: slotIdx,
                targetSets: slot.buildSets,
                targetReps: slot.buildReps,
                notes: slot.label,
                restPeriod: slot.restPeriod,
              }
            })

            workoutData.workoutExercises = {
              create: exerciseSlots,
            }
          }
        }

        await prisma.workout.create({
          data: workoutData,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error generating workouts:', error)
    return NextResponse.json(
      { error: 'Failed to generate workouts' },
      { status: 500 }
    )
  }
}
