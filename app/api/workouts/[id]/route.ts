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

    const workout = await prisma.workout.findFirst({
      where: {
        id,
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
          take: 1,
          include: {
            exerciseLogs: {
              where: { skipped: false },
              orderBy: { setNumber: 'asc' },
              select: {
                exerciseId: true,
                setNumber: true,
                reps: true,
                weight: true,
              },
            },
          },
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
    const { dayOfWeek } = body

    // Verify ownership before updating
    const workout = await prisma.workout.findFirst({
      where: {
        id,
        microcycle: {
          mesocycle: {
            macrocycle: {
              userId: session.user.id,
            },
          },
        },
      },
      include: {
        workoutLogs: {
          select: { id: true },
        },
      },
    })

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }

    // Only allow updating day if workout hasn't been completed
    if (workout.workoutLogs.length > 0) {
      return NextResponse.json(
        { error: 'Cannot update completed workout' },
        { status: 400 }
      )
    }

    const updated = await prisma.workout.update({
      where: { id },
      data: {
        dayOfWeek: dayOfWeek === null ? null : parseInt(dayOfWeek),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating workout:', error)
    return NextResponse.json(
      { error: 'Failed to update workout' },
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

    const deleted = await prisma.workout.deleteMany({
      where: {
        id,
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
