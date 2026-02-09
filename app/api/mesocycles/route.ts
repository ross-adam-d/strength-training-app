import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const mesocycleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  focus: z.string().optional(),
  goal: z.string().optional(),
  trainingDaysPerWeek: z.number().int().min(1).max(7).optional(),
  macrocycleId: z.string(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = mesocycleSchema.parse(body)

    // Verify the macrocycle belongs to the user
    const macrocycle = await prisma.macrocycle.findFirst({
      where: {
        id: data.macrocycleId,
        userId: session.user.id,
      },
    })

    if (!macrocycle) {
      return NextResponse.json(
        { error: 'Macrocycle not found' },
        { status: 404 }
      )
    }

    const mesocycle = await prisma.mesocycle.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        focus: data.focus,
        goal: data.goal,
        trainingDaysPerWeek: data.trainingDaysPerWeek,
        macrocycleId: data.macrocycleId,
      },
    })

    return NextResponse.json(mesocycle, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating mesocycle:', error)
    return NextResponse.json(
      { error: 'Failed to create mesocycle' },
      { status: 500 }
    )
  }
}
