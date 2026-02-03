import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const macrocycleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  goals: z.string().optional(),
  status: z.enum(['active', 'completed', 'paused']).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const macrocycle = await prisma.macrocycle.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        mesocycles: {
          orderBy: {
            startDate: 'asc',
          },
          include: {
            microcycles: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    if (!macrocycle) {
      return NextResponse.json(
        { error: 'Macrocycle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(macrocycle)
  } catch (error) {
    console.error('Error fetching macrocycle:', error)
    return NextResponse.json(
      { error: 'Failed to fetch macrocycle' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = macrocycleSchema.parse(body)

    const updateData: any = { ...data }
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)

    const macrocycle = await prisma.macrocycle.updateMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: updateData,
    })

    if (macrocycle.count === 0) {
      return NextResponse.json(
        { error: 'Macrocycle not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.macrocycle.findUnique({
      where: { id: params.id },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating macrocycle:', error)
    return NextResponse.json(
      { error: 'Failed to update macrocycle' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deleted = await prisma.macrocycle.deleteMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Macrocycle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting macrocycle:', error)
    return NextResponse.json(
      { error: 'Failed to delete macrocycle' },
      { status: 500 }
    )
  }
}
