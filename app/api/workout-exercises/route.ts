import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const setTargetSchema = z.object({
  sets: z.number().int().positive(),
  reps: z.string(),
  weight: z.number().optional(),
})

const createSchema = z.object({
  workoutId: z.string().min(1, 'Workout ID is required'),
  exerciseId: z.string().min(1, 'Exercise must be selected'),
  targetSets: z.number().int().positive('Target sets must be at least 1'),
  targetReps: z.string().nullable().optional(),
  tempo: z.string().nullable().optional(),
  targetRir: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
  restPeriod: z.number().int().nullable().optional(),
  setTargets: z.array(setTargetSchema).nullable().optional(),
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

    // Derive targetSets from setTargets if prescribed mode
    const resolvedTargetSets = data.setTargets?.length
      ? data.setTargets.reduce((sum, g) => sum + g.sets, 0)
      : data.targetSets

    const slot = await prisma.workoutExercise.create({
      data: {
        workoutId: data.workoutId,
        exerciseId: data.exerciseId,
        orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
        targetSets: resolvedTargetSets,
        targetReps: data.setTargets?.length ? null : data.targetReps,
        tempo: data.tempo,
        targetRir: data.setTargets?.length ? null : data.targetRir,
        notes: data.notes,
        restPeriod: data.restPeriod,
        setTargets: data.setTargets ?? Prisma.DbNull,
      },
      include: { exercise: { select: { id: true, name: true, description: true, isUnilateral: true, isTimed: true, isBodyweight: true } } },
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
