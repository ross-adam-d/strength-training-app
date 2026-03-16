import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

async function verifyExerciseOwnership(coachId: string, exerciseId: string) {
  const ex = await prisma.coachPhaseTemplateExercise.findFirst({
    where: { id: exerciseId, workout: { template: { coachId } } },
  })
  return !!ex
}

const setTargetSchema = z.object({
  sets: z.number().int().positive(),
  reps: z.string(),
  weight: z.number().optional(),
})

const patchSchema = z.object({
  exerciseId: z.string().optional(),
  targetSets: z.number().int().min(1).optional(),
  targetReps: z.string().nullable().optional(),
  targetRpe: z.number().min(1).max(10).nullable().optional(),
  targetRir: z.number().int().min(0).max(5).nullable().optional(),
  tempo: z.string().nullable().optional(),
  restPeriod: z.number().int().min(0).nullable().optional(),
  supersetWithPrevious: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  orderIndex: z.number().int().optional(),
  setTargets: z.array(setTargetSchema).nullable().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ templateId: string; workoutId: string; exerciseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { exerciseId } = await params
    if (!(await verifyExerciseOwnership(session.user.id, exerciseId))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { setTargets, ...rest } = patchSchema.parse(body)

    const patchData: any = { ...rest }
    if (setTargets !== undefined) {
      patchData.setTargets = setTargets ?? Prisma.DbNull
      if (setTargets && setTargets.length > 0) {
        patchData.targetSets = setTargets.reduce((sum, g) => sum + g.sets, 0)
        patchData.targetReps = null
        patchData.targetRir = null
      }
    }

    const updated = await prisma.coachPhaseTemplateExercise.update({
      where: { id: exerciseId },
      data: patchData,
      include: {
        exercise: { select: { id: true, name: true, muscleGroups: true, equipment: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 })
    }
    console.error('Error updating template exercise:', error)
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ templateId: string; workoutId: string; exerciseId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { exerciseId } = await params
  if (!(await verifyExerciseOwnership(session.user.id, exerciseId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.coachPhaseTemplateExercise.delete({ where: { id: exerciseId } })
  return NextResponse.json({ success: true })
}
