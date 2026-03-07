import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

async function verifyOwnership(coachId: string, templateId: string) {
  const template = await prisma.coachPhaseTemplate.findFirst({
    where: { id: templateId, coachId },
  })
  return !!template
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  focus: z.string().nullable().optional(),
  goal: z.string().nullable().optional(),
  trainingSplit: z.string().nullable().optional(),
  daysPerWeek: z.number().int().min(1).max(7).nullable().optional(),
  defaultWeeks: z.number().int().min(1).max(12).optional(),
  warmupNotes: z.string().nullable().optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { templateId } = await params

  const template = await prisma.coachPhaseTemplate.findFirst({
    where: { id: templateId, coachId: session.user.id },
    include: {
      workouts: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercises: {
            orderBy: { orderIndex: 'asc' },
            include: {
              exercise: {
                select: { id: true, name: true, muscleGroups: true, equipment: true },
              },
            },
          },
        },
      },
    },
  })

  if (!template) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(template)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { templateId } = await params
    if (!(await verifyOwnership(session.user.id, templateId))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const data = patchSchema.parse(body)

    const template = await prisma.coachPhaseTemplate.update({
      where: { id: templateId },
      data,
    })

    return NextResponse.json(template)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 })
    }
    console.error('Error updating phase template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { templateId } = await params
  if (!(await verifyOwnership(session.user.id, templateId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.coachPhaseTemplate.delete({ where: { id: templateId } })
  return NextResponse.json({ success: true })
}
