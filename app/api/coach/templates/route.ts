import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  focus: z.string().optional(),
  goal: z.string().optional(),
  trainingSplit: z.string().optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  defaultWeeks: z.number().int().min(1).max(12).default(4),
  warmupNotes: z.string().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const templates = await prisma.coachPhaseTemplate.findMany({
    where: { coachId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      focus: true,
      goal: true,
      trainingSplit: true,
      daysPerWeek: true,
      defaultWeeks: true,
      updatedAt: true,
      _count: { select: { workouts: true } },
    },
  })

  return NextResponse.json(templates)
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createSchema.parse(body)

    const template = await prisma.coachPhaseTemplate.create({
      data: {
        coachId: session.user.id,
        name: data.name,
        description: data.description,
        focus: data.focus,
        goal: data.goal,
        trainingSplit: data.trainingSplit,
        daysPerWeek: data.daysPerWeek,
        defaultWeeks: data.defaultWeeks,
        warmupNotes: data.warmupNotes,
      },
    })

    return NextResponse.json({ id: template.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating phase template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
