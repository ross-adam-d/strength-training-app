import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const microcycleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  weekNumber: z.number().int().positive(),
  mesocycleId: z.string(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = microcycleSchema.parse(body)

    // Verify the mesocycle belongs to the user
    const mesocycle = await prisma.mesocycle.findFirst({
      where: {
        id: data.mesocycleId,
        macrocycle: {
          userId: session.user.id,
        },
      },
    })

    if (!mesocycle) {
      return NextResponse.json(
        { error: 'Mesocycle not found' },
        { status: 404 }
      )
    }

    const microcycle = await prisma.microcycle.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        weekNumber: data.weekNumber,
        mesocycleId: data.mesocycleId,
      },
    })

    return NextResponse.json(microcycle, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating microcycle:', error)
    return NextResponse.json(
      { error: 'Failed to create microcycle' },
      { status: 500 }
    )
  }
}
