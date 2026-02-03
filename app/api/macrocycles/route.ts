import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const macrocycleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  goals: z.string().optional(),
  status: z.enum(['active', 'completed', 'paused']).default('active'),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const macrocycles = await prisma.macrocycle.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        startDate: 'desc',
      },
      include: {
        mesocycles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(macrocycles)
  } catch (error) {
    console.error('Error fetching macrocycles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch macrocycles' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = macrocycleSchema.parse(body)

    const macrocycle = await prisma.macrocycle.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        userId: session.user.id,
      },
    })

    return NextResponse.json(macrocycle, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating macrocycle:', error)
    return NextResponse.json(
      { error: 'Failed to create macrocycle' },
      { status: 500 }
    )
  }
}
