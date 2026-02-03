import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mesocycle = await prisma.mesocycle.findFirst({
      where: {
        id: params.id,
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deleted = await prisma.mesocycle.deleteMany({
      where: {
        id: params.id,
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
