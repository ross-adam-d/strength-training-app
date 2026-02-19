import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getWorkoutType, getDaysOfWeek } from '@/lib/splitTemplates'

// Map training split labels to workout type rotations
function getSplitWorkoutTypes(trainingSplit: string): string[] {
  const splitMap: Record<string, string[]> = {
    // Current splits
    'Full Body':         ['Full Body'],
    'Push-Pull':         ['Push', 'Pull'],
    'Upper-Lower':       ['Upper', 'Lower'],
    'Upper-Lower-Upper': ['Upper', 'Lower', 'Upper'],
    'Lower-Upper-Lower': ['Lower', 'Upper', 'Lower'],
    '3×Upper + 2×Lower': ['Upper', 'Upper', 'Upper', 'Lower', 'Lower'],
    '3×Lower + 2×Upper': ['Lower', 'Lower', 'Lower', 'Upper', 'Upper'],
    '4×Upper + 3×Lower': ['Upper', 'Upper', 'Upper', 'Upper', 'Lower', 'Lower', 'Lower'],
    '4×Lower + 3×Upper': ['Lower', 'Lower', 'Lower', 'Lower', 'Upper', 'Upper', 'Upper'],
    'Bro Split':         ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms'],
    'Custom':            ['Full Body'],
    // Legacy names (backwards compatibility for existing DB data)
    'Upper/Lower':       ['Upper', 'Lower'],
    'Push/Pull':         ['Push', 'Pull'],
    'Push/Pull/Legs':    ['Push', 'Pull', 'Legs'],
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
    const { mode, regenerate } = body // mode: 'default' or 'manual'; regenerate: bool

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
        macrocycle: {
          select: { availableEquipment: true },
        },
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

    // availableEquipment: empty array = legacy macrocycle → treat as all available
    const availableEquipment: string[] = mesocycle.macrocycle?.availableEquipment ?? []

    // If regenerating, delete all existing workouts across all microcycles first
    if (regenerate) {
      const microcycleIds = mesocycle.microcycles.map((m) => m.id)
      await prisma.workout.deleteMany({
        where: { microcycleId: { in: microcycleIds } },
      })
    }

    // Get workout types based on split
    const workoutTypeNames = getSplitWorkoutTypes(mesocycle.trainingSplit)
    const daysOfWeek = getDaysOfWeek(mesocycle.trainingDaysPerWeek)

    // Create workout rotation
    const rotation = daysOfWeek.map((_: number, i: number) =>
      workoutTypeNames[i % workoutTypeNames.length]
    )

    // Count occurrences of each workout type to add A, B, C suffixes
    const workoutTypeCounts = new Map<string, number>()

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

    // Sequential creates — PgBouncer Session mode limits concurrent connections to pool_size
    for (const microcycle of mesocycle.microcycles) {
      workoutTypeCounts.clear()

      for (let i = 0; i < daysOfWeek.length; i++) {
        const dayOfWeek = daysOfWeek[i]
        const workoutTypeName = rotation[i]

        const currentCount = (workoutTypeCounts.get(workoutTypeName) || 0) + 1
        workoutTypeCounts.set(workoutTypeName, currentCount)

        const suffix = String.fromCharCode(64 + currentCount)
        const workoutName = `${workoutTypeName} ${suffix}`

        const workoutData: any = {
          name: workoutName,
          dayOfWeek,
          microcycleId: microcycle.id,
          orderIndex: i,
        }

        if (mode === 'default') {
          const workoutType = getWorkoutType(workoutTypeName)

          if (!workoutType) {
            throw new Error(`Workout type template not found: "${workoutTypeName}". Available splits: Full Body, Upper/Lower, Push/Pull/Legs, Bro Split.`)
          }

          const exerciseSlots = workoutType.slots.map((slot, slotIdx) => {
            // Resolve exercise: check primary equipment, walk alternatives, fall back to primary
            const equipmentFilter = availableEquipment.length > 0 ? availableEquipment : null

            let resolvedName = slot.exerciseName
            if (equipmentFilter && !slot.equipment.every((eq) => equipmentFilter.includes(eq))) {
              const match = slot.alternatives.find(
                (alt) => alt.equipment.every((eq) => equipmentFilter.includes(eq)) && exerciseMap.has(alt.exerciseName)
              )
              if (match) resolvedName = match.exerciseName
              // else: fall back to primary regardless of equipment
            }

            const exerciseId = exerciseMap.get(resolvedName)
            if (!exerciseId) {
              throw new Error(`Exercise not found in database: "${resolvedName}". Please make sure all exercises exist in the exercise library.`)
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

          workoutData.workoutExercises = { create: exerciseSlots }
        }

        await prisma.workout.create({ data: workoutData })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error generating workouts:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate workouts'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
