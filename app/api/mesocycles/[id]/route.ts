import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateMesocycleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  focus: z.string().optional(),
  goal: z.string().optional(),
  trainingDaysPerWeek: z.number().int().min(1).max(7).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mesocycle = await prisma.mesocycle.findFirst({
      where: {
        id,
        macrocycle: {
          userId: session.user.id,
        },
      },
      include: {
        macrocycle: {
          select: {
            id: true,
            name: true,
          },
        },
        microcycles: {
          orderBy: {
            startDate: 'asc',
          },
          include: {
            workouts: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    if (!mesocycle) {
      return NextResponse.json(
        { error: 'Mesocycle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(mesocycle)
  } catch (error) {
    console.error('Error fetching mesocycle:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mesocycle' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateMesocycleSchema.parse(body)

    // Verify ownership
    const existing = await prisma.mesocycle.findFirst({
      where: {
        id,
        macrocycle: {
          userId: session.user.id,
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Mesocycle not found' },
        { status: 404 }
      )
    }

    const updateData: any = { ...data }
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)

    const mesocycle = await prisma.mesocycle.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(mesocycle)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating mesocycle:', error)
    return NextResponse.json(
      { error: 'Failed to update mesocycle' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deleted = await prisma.mesocycle.deleteMany({
      where: {
        id,
        macrocycle: {
          userId: session.user.id,
        },
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Mesocycle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting mesocycle:', error)
    return NextResponse.json(
      { error: 'Failed to delete mesocycle' },
      { status: 500 }
    )
  }
}
