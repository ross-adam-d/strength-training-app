import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachClientAccess } from '@/lib/coachAccess'
import { z } from 'zod'

const createBlockSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['planned', 'active']).default('planned'),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { clientId } = await params
  const hasAccess = await verifyCoachClientAccess(session.user.id, clientId)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const macrocycles = await prisma.macrocycle.findMany({
    where: { userId: clientId },
    orderBy: { startDate: 'desc' },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      description: true,
      goals: true,
      createdByCoachId: true,
      mesocycles: {
        select: { id: true, name: true, status: true },
        orderBy: { startDate: 'asc' },
      },
    },
  })

  return NextResponse.json(macrocycles)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { clientId } = await params
    const hasAccess = await verifyCoachClientAccess(session.user.id, clientId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createBlockSchema.parse(body)

    const start = new Date(data.startDate)
    const end = new Date(data.endDate)

    if (end <= start) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    const macrocycle = await prisma.macrocycle.create({
      data: {
        name: data.name,
        startDate: start,
        endDate: end,
        status: data.status,
        userId: clientId,
        createdByCoachId: session.user.id,
      },
    })

    // Create one default phase spanning the full range
    const mesocycle = await prisma.mesocycle.create({
      data: {
        name: 'Phase 1',
        startDate: start,
        endDate: end,
        macrocycleId: macrocycle.id,
      },
    })

    // Create one microcycle per week
    const msPerWeek = 7 * 24 * 60 * 60 * 1000
    const totalMs = end.getTime() - start.getTime()
    const weeks = Math.max(1, Math.ceil(totalMs / msPerWeek))

    for (let week = 1; week <= weeks; week++) {
      const weekStart = new Date(start.getTime() + (week - 1) * msPerWeek)
      const weekEnd = new Date(Math.min(weekStart.getTime() + msPerWeek, end.getTime()))
      await prisma.microcycle.create({
        data: {
          name: `Week ${week}`,
          weekNumber: week,
          startDate: weekStart,
          endDate: weekEnd,
          mesocycleId: mesocycle.id,
        },
      })
    }

    return NextResponse.json({ id: macrocycle.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating block for client:', error)
    return NextResponse.json({ error: 'Failed to create block' }, { status: 500 })
  }
}
