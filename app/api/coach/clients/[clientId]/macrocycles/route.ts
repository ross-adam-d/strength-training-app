import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachClientAccess } from '@/lib/coachAccess'
import { z } from 'zod'

const microcycleSchema = z.object({
  name: z.string(),
  weekNumber: z.number().int(),
  startDate: z.string(),
  endDate: z.string(),
  isRecovery: z.boolean().optional().default(false),
})

const mesocycleSchema = z.object({
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  microcycles: z.array(microcycleSchema),
})

const createBlockSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['planned', 'active']).default('active'),
  availableEquipment: z.array(z.string()).default([]),
  mesocycles: z.array(mesocycleSchema),
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

    // Create macrocycle for client (coach-owned)
    const macrocycle = await prisma.macrocycle.create({
      data: {
        name: data.name,
        startDate: start,
        endDate: end,
        status: data.status,
        availableEquipment: data.availableEquipment,
        userId: clientId,
        createdByCoachId: session.user.id,
      },
    })

    // Create mesocycles and microcycles (sequential — PgBouncer compatible)
    for (const mesoData of data.mesocycles) {
      const meso = await prisma.mesocycle.create({
        data: {
          name: mesoData.name,
          startDate: new Date(mesoData.startDate),
          endDate: new Date(mesoData.endDate),
          macrocycleId: macrocycle.id,
        },
      })

      for (const microData of mesoData.microcycles) {
        await prisma.microcycle.create({
          data: {
            name: microData.name,
            weekNumber: microData.weekNumber,
            startDate: new Date(microData.startDate),
            endDate: new Date(microData.endDate),
            isRecovery: microData.isRecovery ?? false,
            mesocycleId: meso.id,
          },
        })
      }
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
