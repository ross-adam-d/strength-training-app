import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const exerciseSlotSchema = z.object({
  exerciseId: z.string(),
  orderIndex: z.number().int(),
  targetSets: z.number().int().positive(),
  targetReps: z.string(),
  tempo: z.string().optional(),
  restPeriod: z.number().int().optional(),
  targetRir: z.number().int().optional(),
  notes: z.string().optional(),
})

const syncSchema = z.object({
  workoutName: z.string(),
  exercises: z.array(exerciseSlotSchema),
  applyToSubsequent: z.boolean().default(false),
})

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

    const mesocycle = await prisma.mesocycle.findFirst({
      where: {
        id,
        macrocycle: { userId: session.user.id },
      },
      include: {
        macrocycle: {
          include: {
            mesocycles: { orderBy: { startDate: 'asc' } },
          },
        },
      },
    })

    if (!mesocycle) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    const body = await request.json()
    const data = syncSchema.parse(body)

    const allMeso = mesocycle.macrocycle.mesocycles
    const thisIndex = allMeso.findIndex((m) => m.id === id)
    const targetIds = data.applyToSubsequent
      ? allMeso.slice(thisIndex).map((m) => m.id)
      : [id]

    let updatedCount = 0

    for (const mesoId of targetIds) {
      const workouts = await prisma.workout.findMany({
        where: {
          microcycle: { mesocycleId: mesoId },
          name: data.workoutName,
        },
        select: { id: true },
      })

      for (const workout of workouts) {
        await prisma.workoutExercise.deleteMany({ where: { workoutId: workout.id } })

        await prisma.workoutExercise.createMany({
          data: data.exercises.map((slot) => ({
            workoutId: workout.id,
            exerciseId: slot.exerciseId,
            orderIndex: slot.orderIndex,
            targetSets: slot.targetSets,
            targetReps: slot.targetReps,
            tempo: slot.tempo || null,
            restPeriod: slot.restPeriod ?? null,
            targetRir: slot.targetRir ?? null,
            notes: slot.notes || null,
          })),
        })

        updatedCount++
      }
    }

    return NextResponse.json({ updated: updatedCount })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error syncing exercises:', error)
    return NextResponse.json({ error: 'Failed to sync exercises' }, { status: 500 })
  }
}
