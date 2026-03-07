import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

async function verifyWorkoutOwnership(coachId: string, templateId: string, workoutId: string) {
  const workout = await prisma.coachPhaseTemplateWorkout.findFirst({
    where: { id: workoutId, templateId, template: { coachId } },
  })
  return !!workout
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateId: string; workoutId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { templateId, workoutId } = await params
  const workout = await prisma.coachPhaseTemplateWorkout.findFirst({
    where: { id: workoutId, templateId, template: { coachId: session.user.id } },
    include: {
      template: { select: { id: true, name: true } },
      exercises: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercise: { select: { id: true, name: true, muscleGroups: true } },
        },
      },
    },
  })
  if (!workout) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(workout)
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  orderIndex: z.number().int().optional(),
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  warmupNotes: z.string().nullable().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ templateId: string; workoutId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { templateId, workoutId } = await params
    if (!(await verifyWorkoutOwnership(session.user.id, templateId, workoutId))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const data = patchSchema.parse(body)

    const workout = await prisma.coachPhaseTemplateWorkout.update({
      where: { id: workoutId },
      data,
    })

    return NextResponse.json(workout)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 })
    }
    console.error('Error updating template workout:', error)
    return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ templateId: string; workoutId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { templateId, workoutId } = await params
  if (!(await verifyWorkoutOwnership(session.user.id, templateId, workoutId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.coachPhaseTemplateWorkout.delete({ where: { id: workoutId } })
  return NextResponse.json({ success: true })
}
