import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  workoutId: z.string(),
  exerciseId: z.string(),
  targetSets: z.number().int().positive(),
  targetReps: z.string().nullable().optional(),
  tempo: z.string().nullable().optional(),
  targetRir: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
  restPeriod: z.number().int().nullable().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createSchema.parse(body)

    // Verify the workout belongs to the user via relation chain
    const workout = await prisma.workout.findFirst({
      where: {
        id: data.workoutId,
        microcycle: {
          mesocycle: {
            macrocycle: { userId: session.user.id },
          },
        },
      },
    })

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    // Auto-assign orderIndex as max + 1
    const maxOrder = await prisma.workoutExercise.aggregate({
      _max: { orderIndex: true },
      where: { workoutId: data.workoutId },
    })

    const slot = await prisma.workoutExercise.create({
      data: {
        workoutId: data.workoutId,
        exerciseId: data.exerciseId,
        orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
        targetSets: data.targetSets,
        targetReps: data.targetReps,
        tempo: data.tempo,
        targetRir: data.targetRir,
        notes: data.notes,
        restPeriod: data.restPeriod,
      },
      include: { exercise: { select: { id: true, name: true } } },
    })

    return NextResponse.json(slot, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating workout exercise:', error)
    return NextResponse.json({ error: 'Failed to add exercise' }, { status: 500 })
  }
}
