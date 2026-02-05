import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const microcycle = await prisma.microcycle.findFirst({
      where: {
        id,
        mesocycle: {
          macrocycle: {
            userId: session.user.id,
          },
        },
      },
      include: {
        mesocycle: {
          select: {
            id: true,
            name: true,
            macrocycle: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        workouts: {
          orderBy: {
            dayOfWeek: 'asc',
          },
          include: {
            workoutExercises: {
              orderBy: {
                orderIndex: 'asc',
              },
              include: {
                exercise: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            workoutLogs: {
              orderBy: { completedAt: 'desc' },
              take: 1,
              include: {
                exerciseLogs: {
                  orderBy: { setNumber: 'asc' },
                  include: {
                    exercise: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!microcycle) {
      return NextResponse.json(
        { error: 'Microcycle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(microcycle)
  } catch (error) {
    console.error('Error fetching microcycle:', error)
    return NextResponse.json(
      { error: 'Failed to fetch microcycle' },
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

    const deleted = await prisma.microcycle.deleteMany({
      where: {
        id,
        mesocycle: {
          macrocycle: {
            userId: session.user.id,
          },
        },
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Microcycle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting microcycle:', error)
    return NextResponse.json(
      { error: 'Failed to delete microcycle' },
      { status: 500 }
    )
  }
}
