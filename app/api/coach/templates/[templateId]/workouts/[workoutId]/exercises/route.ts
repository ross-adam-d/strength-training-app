import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  exerciseId: z.string().min(1),
  targetSets: z.number().int().min(1).default(3),
  targetReps: z.string().optional(),
  targetRpe: z.number().min(1).max(10).nullable().optional(),
  targetRir: z.number().int().min(0).max(5).nullable().optional(),
  restPeriod: z.number().int().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string; workoutId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { templateId, workoutId } = await params

    const workout = await prisma.coachPhaseTemplateWorkout.findFirst({
      where: { id: workoutId, templateId, template: { coachId: session.user.id } },
    })
    if (!workout) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const data = createSchema.parse(body)

    const count = await prisma.coachPhaseTemplateExercise.count({ where: { workoutId } })

    const exercise = await prisma.coachPhaseTemplateExercise.create({
      data: {
        workoutId,
        exerciseId: data.exerciseId,
        orderIndex: count,
        targetSets: data.targetSets,
        targetReps: data.targetReps ?? null,
        targetRpe: data.targetRpe ?? null,
        targetRir: data.targetRir ?? null,
        restPeriod: data.restPeriod ?? null,
        notes: data.notes ?? null,
      },
      include: {
        exercise: { select: { id: true, name: true, muscleGroups: true, equipment: true } },
      },
    })

    return NextResponse.json(exercise, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 })
    }
    console.error('Error adding exercise to template workout:', error)
    return NextResponse.json({ error: 'Failed to add exercise' }, { status: 500 })
  }
}
