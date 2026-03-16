import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachBlockAccess } from '@/lib/coachAccess'
import { z } from 'zod'

const updateSchema = z.object({
  exerciseId: z.string().optional(),
  targetSets: z.number().int().positive().optional(),
  targetReps: z.string().nullable().optional(),
  tempo: z.string().nullable().optional(),
  targetRir: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
  orderIndex: z.number().int().optional(),
  restPeriod: z.number().int().nullable().optional(),
  supersetWithPrevious: z.boolean().optional(),
  applyToRestOfPhase: z.boolean().optional(),
  mesocycleId: z.string().optional(),
  swapExercise: z.boolean().optional(),
})

async function verifyOwnership(id: string, userId: string) {
  return prisma.workoutExercise.findFirst({
    where: {
      id,
      workout: {
        microcycle: {
          mesocycle: {
            macrocycle: { userId },
          },
        },
      },
    },
  })
}

async function verifyCoachExerciseAccess(coachId: string, workoutExerciseId: string): Promise<boolean> {
  const we = await prisma.workoutExercise.findFirst({
    where: { id: workoutExerciseId },
    select: { workout: { select: { microcycle: { select: { mesocycle: { select: { macrocycle: { select: { id: true } } } } } } } } },
  })
  const macrocycleId = we?.workout?.microcycle?.mesocycle?.macrocycle?.id
  if (!macrocycleId) return false
  return verifyCoachBlockAccess(coachId, macrocycleId)
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

    const isCoach = session.user.role === 'COACH'
    const existing = isCoach
      ? (await verifyCoachExerciseAccess(session.user.id, id) ? true : null)
      : await verifyOwnership(id, session.user.id)
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { applyToRestOfPhase, mesocycleId, swapExercise, ...updateData } = updateSchema.parse(body)

    // Update the current exercise
    const updated = await prisma.workoutExercise.update({
      where: { id },
      data: updateData,
      include: {
        exercise: { select: { id: true, name: true } },
        workout: {
          include: {
            microcycle: {
              include: {
                mesocycle: true,
              },
            },
          },
        },
      },
    })

    // If applyToRestOfPhase is true and supersetWithPrevious was updated
    if (applyToRestOfPhase && updateData.supersetWithPrevious !== undefined && mesocycleId) {
      console.log('🔄 Applying superset changes to rest of phase...')
      const currentWorkout = updated.workout
      const currentMicrocycle = currentWorkout.microcycle
      const currentOrderIndex = updated.orderIndex

      console.log('Current workout:', {
        name: currentWorkout.name,
        dayOfWeek: currentWorkout.dayOfWeek,
        weekNumber: currentMicrocycle.weekNumber,
        orderIndex: currentOrderIndex,
        supersetValue: updateData.supersetWithPrevious
      })

      // Find all future microcycles in the same mesocycle
      const futureMicrocycles = await prisma.microcycle.findMany({
        where: {
          mesocycleId,
          weekNumber: { gt: currentMicrocycle.weekNumber },
        },
        include: {
          workouts: {
            include: {
              workoutExercises: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
        },
      })

      console.log(`Found ${futureMicrocycles.length} future microcycles`)

      // Update exercises at the same orderIndex in matching workouts
      const exercisesToUpdate: Array<{
        id: string
        workoutName: string
        weekNumber: number
        currentValue: boolean
        newValue: boolean
      }> = []

      for (const microcycle of futureMicrocycles) {
        // Find workouts with the same day or name (to match recurring workouts)
        const matchingWorkouts = microcycle.workouts.filter(
          (w) =>
            (w.dayOfWeek !== null && w.dayOfWeek === currentWorkout.dayOfWeek) ||
            w.name === currentWorkout.name
        )

        console.log(`Week ${microcycle.weekNumber}: Found ${matchingWorkouts.length} matching workouts`)

        for (const workout of matchingWorkouts) {
          // Find the exercise at the same orderIndex
          const exerciseToUpdate = workout.workoutExercises.find(
            (we) => we.orderIndex === currentOrderIndex
          )

          if (exerciseToUpdate) {
            exercisesToUpdate.push({
              id: exerciseToUpdate.id,
              workoutName: workout.name,
              weekNumber: microcycle.weekNumber,
              currentValue: exerciseToUpdate.supersetWithPrevious,
              newValue: updateData.supersetWithPrevious!
            })
            console.log(`  - Will update exercise in Week ${microcycle.weekNumber} "${workout.name}": ${exerciseToUpdate.supersetWithPrevious} → ${updateData.supersetWithPrevious}`)
          } else {
            console.log(`  - No exercise found at orderIndex ${currentOrderIndex} in workout "${workout.name}"`)
          }
        }
      }

      console.log('\n📝 Summary of updates:', exercisesToUpdate)
      console.log(`\n🔄 Executing ${exercisesToUpdate.length} database updates...`)

      // Execute all updates
      const updateResults = await Promise.all(
        exercisesToUpdate.map(ex =>
          prisma.workoutExercise.update({
            where: { id: ex.id },
            data: { supersetWithPrevious: ex.newValue },
          })
        )
      )

      console.log('✅ Superset propagation complete -', updateResults.length, 'exercises updated')
      console.log('Updated exercise IDs:', updateResults.map(r => r.id))
    } else {
      console.log('⏭️  Skipping superset propagation:', {
        applyToRestOfPhase,
        hasSupersetUpdate: updateData.supersetWithPrevious !== undefined,
        hasMesocycleId: !!mesocycleId
      })
    }

    // Handle exercise swap with scope
    if (applyToRestOfPhase && swapExercise && updateData.exerciseId && mesocycleId) {
      console.log('🔄 Applying exercise swap to rest of phase...')
      const currentWorkout = updated.workout
      const currentMicrocycle = currentWorkout.microcycle
      const currentOrderIndex = updated.orderIndex

      console.log('Swapping to exerciseId:', updateData.exerciseId, 'at orderIndex:', currentOrderIndex)

      // Find all future microcycles in the same mesocycle
      const futureMicrocycles = await prisma.microcycle.findMany({
        where: {
          mesocycleId,
          weekNumber: { gt: currentMicrocycle.weekNumber },
        },
        include: {
          workouts: {
            include: {
              workoutExercises: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
        },
      })

      console.log(`Found ${futureMicrocycles.length} future microcycles for exercise swap`)

      // Update exercises at the same orderIndex in matching workouts
      const swapPromises: Promise<any>[] = []

      for (const microcycle of futureMicrocycles) {
        // Find workouts with the same day or name (to match recurring workouts)
        const matchingWorkouts = microcycle.workouts.filter(
          (w) =>
            (w.dayOfWeek !== null && w.dayOfWeek === currentWorkout.dayOfWeek) ||
            w.name === currentWorkout.name
        )

        console.log(`Week ${microcycle.weekNumber}: Found ${matchingWorkouts.length} matching workouts`)

        for (const workout of matchingWorkouts) {
          // Find the exercise at the same orderIndex
          const exerciseToSwap = workout.workoutExercises.find(
            (we) => we.orderIndex === currentOrderIndex
          )

          if (exerciseToSwap) {
            console.log(`  - Swapping exercise in Week ${microcycle.weekNumber} "${workout.name}"`)
            swapPromises.push(
              prisma.workoutExercise.update({
                where: { id: exerciseToSwap.id },
                data: { exerciseId: updateData.exerciseId },
              })
            )
          }
        }
      }

      console.log(`🔄 Executing ${swapPromises.length} exercise swaps...`)
      await Promise.all(swapPromises)
      console.log('✅ Exercise swap propagation complete')
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating workout exercise:', error)
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 })
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

    const isCoachDelete = session.user.role === 'COACH'
    const existingDelete = isCoachDelete
      ? (await verifyCoachExerciseAccess(session.user.id, id) ? true : null)
      : await verifyOwnership(id, session.user.id)
    if (!existingDelete) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.workoutExercise.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout exercise:', error)
    return NextResponse.json({ error: 'Failed to delete exercise' }, { status: 500 })
  }
}
