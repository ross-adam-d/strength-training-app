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

    const workout = await prisma.workout.findFirst({
      where: {
        id: params.id,
        microcycle: {
          mesocycle: {
            macrocycle: {
              userId: session.user.id,
            },
          },
        },
      },
      include: {
        microcycle: {
          select: {
            id: true,
            name: true,
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
          },
        },
        workoutExercises: {
          orderBy: {
            orderIndex: 'asc',
          },
          include: {
            exercise: true,
          },
        },
        workoutLogs: {
          orderBy: {
            completedAt: 'desc',
          },
          take: 5,
        },
      },
    })

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(workout)
  } catch (error) {
    console.error('Error fetching workout:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout' },
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

    const deleted = await prisma.workout.deleteMany({
      where: {
        id: params.id,
        microcycle: {
          mesocycle: {
            macrocycle: {
              userId: session.user.id,
            },
          },
        },
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json(
      { error: 'Failed to delete workout' },
      { status: 500 }
    )
  }
}
