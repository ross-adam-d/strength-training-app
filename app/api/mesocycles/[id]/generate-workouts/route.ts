import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachMesocycleAccess } from '@/lib/coachAccess'
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
    // Olympic Lifts split
    'Olympic Lifts':     ['Olympic A', 'Olympic B'],
    // Legacy: 'Power' split renamed to 'Olympic Lifts' in Session 46
    'Power':             ['Olympic A', 'Olympic B'],
  }

  return splitMap[trainingSplit] || ['Full Body']
}

// Goal-based set/rep overrides — applied when a phase has a training goal set
const GOAL_OVERRIDES: Record<string, { compound: { sets: number; reps: string }; isolation: { sets: number; reps: string } }> = {
  Hypertrophy: { compound: { sets: 4, reps: '6-12'  }, isolation: { sets: 3, reps: '10-15' } },
  Strength:    { compound: { sets: 5, reps: '3-6'   }, isolation: { sets: 3, reps: '6-8'   } },
  Power:       { compound: { sets: 5, reps: '1-5'   }, isolation: { sets: 3, reps: '3-6'   } },
  Maintenance: { compound: { sets: 3, reps: '10-15' }, isolation: { sets: 2, reps: '12-15' } },
  Deload:      { compound: { sets: 2, reps: '12-15' }, isolation: { sets: 2, reps: '12-15' } },
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
    const { mode, regenerate } = body // mode: 'default' | 'manual' | 'repeat-previous'; regenerate: bool

    // Determine ownership: user or coach creator
    let genWhere: any = { id, macrocycle: { userId: session.user.id } }
    if (session.user.role === 'COACH') {
      const coachAccess = await verifyCoachMesocycleAccess(session.user.id, id)
      if (coachAccess) genWhere = { id }
    }

    // Fetch mesocycle with ownership verification
    const mesocycle = await prisma.mesocycle.findFirst({
      where: genWhere,
      select: {
        id: true,
        trainingDaysPerWeek: true,
        trainingSplit: true,
        goal: true,
        macrocycle: {
          select: { id: true, userId: true, availableEquipment: true },
        },
        microcycles: {
          orderBy: {
            weekNumber: 'asc',
          },
          select: {
            id: true,
            weekNumber: true,
            isRecovery: true,
          },
        },
      },
    })

    if (!mesocycle) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    if (mode !== 'repeat-previous' && (!mesocycle.trainingDaysPerWeek || !mesocycle.trainingSplit)) {
      return NextResponse.json(
        { error: 'Please set training days and split for this phase first' },
        { status: 400 }
      )
    }

    // availableEquipment: empty array = legacy macrocycle → treat as all available
    const availableEquipment: string[] = mesocycle.macrocycle?.availableEquipment ?? []
    const goal = mesocycle.goal ?? null

    // If regenerating, delete all existing workouts across all microcycles first
    if (regenerate) {
      const microcycleIds = mesocycle.microcycles.map((m) => m.id)
      await prisma.workout.deleteMany({
        where: { microcycleId: { in: microcycleIds } },
      })
    }

    // ── Repeat Previous Phase ────────────────────────────────────────────
    if (mode === 'repeat-previous') {
      const macrocycleId = mesocycle.macrocycle!.id

      // All phases in this block ordered by startDate
      const allPhases = await prisma.mesocycle.findMany({
        where: { macrocycleId },
        orderBy: { startDate: 'asc' },
        select: { id: true, trainingDaysPerWeek: true, trainingSplit: true },
      })

      const thisIndex = allPhases.findIndex((m) => m.id === id)
      if (thisIndex <= 0) {
        return NextResponse.json(
          { error: 'No previous phase to repeat — this is the first phase' },
          { status: 400 }
        )
      }

      const sourcePhase = allPhases[thisIndex - 1]

      // Fetch week 1 workouts of source phase
      const sourceWeek1 = await prisma.microcycle.findFirst({
        where: { mesocycleId: sourcePhase.id, weekNumber: 1 },
        select: {
          workouts: {
            orderBy: { orderIndex: 'asc' },
            select: {
              name: true,
              dayOfWeek: true,
              estimatedDuration: true,
              warmupNotes: true,
              orderIndex: true,
              workoutExercises: {
                orderBy: { orderIndex: 'asc' },
                select: {
                  exerciseId: true,
                  orderIndex: true,
                  targetSets: true,
                  targetReps: true,
                  targetRpe: true,
                  targetRir: true,
                  tempo: true,
                  restPeriod: true,
                  supersetWithPrevious: true,
                  notes: true,
                },
              },
            },
          },
        },
      })

      if (!sourceWeek1 || sourceWeek1.workouts.length === 0) {
        return NextResponse.json(
          { error: 'The previous phase has no workouts to repeat. Generate workouts in the previous phase first.' },
          { status: 400 }
        )
      }

      // Clone workouts into each destination microcycle sequentially
      for (const microcycle of mesocycle.microcycles) {
        for (const sourceWorkout of sourceWeek1.workouts) {
          await prisma.workout.create({
            data: {
              name: sourceWorkout.name,
              dayOfWeek: sourceWorkout.dayOfWeek,
              estimatedDuration: sourceWorkout.estimatedDuration,
              warmupNotes: sourceWorkout.warmupNotes,
              orderIndex: sourceWorkout.orderIndex,
              microcycleId: microcycle.id,
              workoutExercises: {
                create: sourceWorkout.workoutExercises.map((we) => ({
                  exerciseId: we.exerciseId,
                  orderIndex: we.orderIndex,
                  targetSets: microcycle.isRecovery
                    ? Math.max(1, Math.floor(we.targetSets * 0.6))
                    : we.targetSets,
                  targetReps: we.targetReps,
                  targetRpe: we.targetRpe,
                  targetRir: we.targetRir,
                  tempo: we.tempo,
                  restPeriod: we.restPeriod,
                  supersetWithPrevious: we.supersetWithPrevious,
                  notes: we.notes,
                })),
              },
            },
          })
        }
      }

      // Sync destination phase split/days to match source (goal intentionally not copied)
      await prisma.mesocycle.update({
        where: { id },
        data: {
          trainingDaysPerWeek: sourcePhase.trainingDaysPerWeek,
          trainingSplit: sourcePhase.trainingSplit,
        },
      })

      return NextResponse.json({ success: true })
    }
    // ─────────────────────────────────────────────────────────────────────

    // Get workout types based on split
    const workoutTypeNames = getSplitWorkoutTypes(mesocycle.trainingSplit!)
    const daysOfWeek = getDaysOfWeek(mesocycle.trainingDaysPerWeek!)

    // Create workout rotation
    const rotation = daysOfWeek.map((_: number, i: number) =>
      workoutTypeNames[i % workoutTypeNames.length]
    )

    // Count occurrences of each workout type to add A, B, C suffixes
    const workoutTypeCounts = new Map<string, number>()

    // Fetch all exercises to resolve names to IDs (include coach + client custom exercises)
    const blockOwnerId = mesocycle.macrocycle?.userId ?? session.user.id
    const exercises = await prisma.exercise.findMany({
      where: {
        OR: [
          { isPublic: true },
          { createdById: session.user.id },
          ...(blockOwnerId !== session.user.id ? [{ createdById: blockOwnerId }] : []),
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

            // Priority: isRecovery > goal > default slot values
            let targetSets: number
            let targetReps: string

            if (microcycle.isRecovery) {
              targetSets = Math.max(2, slot.recoverySets)
              targetReps = slot.recoveryReps
            } else if (goal && GOAL_OVERRIDES[goal]) {
              const override = GOAL_OVERRIDES[goal][slot.isCompound ? 'compound' : 'isolation']
              targetSets = override.sets
              targetReps = override.reps
            } else {
              targetSets = slot.buildSets
              targetReps = slot.buildReps
            }

            return {
              exerciseId,
              orderIndex: slotIdx,
              targetSets,
              targetReps,
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
