import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  weekNumber: z.number().int().min(1).default(1),
  orderIndex: z.number().int().default(0),
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  warmupNotes: z.string().nullable().optional(),
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
    if (!template) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const data = createSchema.parse(body)

    // Auto-set orderIndex to end if not provided
    const count = await prisma.coachPhaseTemplateWorkout.count({ where: { templateId } })

    const workout = await prisma.coachPhaseTemplateWorkout.create({
      data: {
        templateId,
        weekNumber: data.weekNumber ?? 1,
        name: data.name,
        orderIndex: data.orderIndex ?? count,
        dayOfWeek: data.dayOfWeek ?? null,
        warmupNotes: data.warmupNotes ?? null,
      },
      include: {
        exercises: {
          include: {
            exercise: { select: { id: true, name: true, muscleGroups: true, equipment: true } },
          },
        },
      },
    })

    return NextResponse.json(workout, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 })
    }
    console.error('Error creating template workout:', error)
    return NextResponse.json({ error: 'Failed to create workout' }, { status: 500 })
  }
}
