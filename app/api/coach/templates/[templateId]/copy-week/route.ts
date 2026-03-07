import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  fromWeek: z.number().int().min(1),
  toWeeks: z.array(z.number().int().min(1)),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { templateId } = await params

    const template = await prisma.coachPhaseTemplate.findFirst({
      where: { id: templateId, coachId: session.user.id },
    })
    if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const { fromWeek, toWeeks } = schema.parse(body)

    // Fetch source week workouts with exercises
    const sourceWorkouts = await prisma.coachPhaseTemplateWorkout.findMany({
      where: { templateId, weekNumber: fromWeek },
      orderBy: { orderIndex: 'asc' },
      include: {
        exercises: {
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
    })

    if (sourceWorkouts.length === 0) {
      return NextResponse.json({ error: `Week ${fromWeek} has no workouts to copy` }, { status: 400 })
    }

    // Delete existing workouts for target weeks, then create copies
    await prisma.coachPhaseTemplateWorkout.deleteMany({
      where: { templateId, weekNumber: { in: toWeeks } },
    })

    for (const toWeek of toWeeks) {
      for (const w of sourceWorkouts) {
        await prisma.coachPhaseTemplateWorkout.create({
          data: {
            templateId,
            weekNumber: toWeek,
            name: w.name,
            orderIndex: w.orderIndex,
            warmupNotes: w.warmupNotes,
            exercises: {
              create: w.exercises.map((ex) => ({
                exerciseId: ex.exerciseId,
                orderIndex: ex.orderIndex,
                targetSets: ex.targetSets,
                targetReps: ex.targetReps ?? undefined,
                targetRpe: ex.targetRpe ?? undefined,
                targetRir: ex.targetRir ?? undefined,
                tempo: ex.tempo ?? undefined,
                restPeriod: ex.restPeriod ?? undefined,
                supersetWithPrevious: ex.supersetWithPrevious,
                notes: ex.notes ?? undefined,
              })),
            },
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 })
    }
    console.error('Error copying week:', error)
    return NextResponse.json({ error: 'Failed to copy week' }, { status: 500 })
  }
}
