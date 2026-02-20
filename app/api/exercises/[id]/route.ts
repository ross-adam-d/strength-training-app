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
    const url = new URL(request.url)

    // Usage check — returns whether exercise is in any active/planned training block
    if (url.searchParams.get('usage') === 'true') {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const activeUsage = await prisma.workoutExercise.findFirst({
        where: {
          exerciseId: id,
          workout: {
            microcycle: {
              mesocycle: {
                macrocycle: {
                  status: { in: ['planned', 'active'] },
                  userId: session.user.id,
                },
              },
            },
          },
        },
        select: {
          workout: {
            select: {
              microcycle: {
                select: {
                  mesocycle: {
                    select: {
                      macrocycle: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (activeUsage) {
        return NextResponse.json({
          inUse: true,
          blockName: activeUsage.workout.microcycle.mesocycle.macrocycle.name,
        })
      }
      return NextResponse.json({ inUse: false })
    }

    const exercise = await prisma.exercise.findUnique({
      where: {
        id,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(exercise)
  } catch (error) {
    console.error('Error fetching exercise:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercise' },
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
    const { isUnilateral, isTimed, isBodyweight, name, description, muscleGroups, equipment } = body

    // Find the exercise
    const exercise = await prisma.exercise.findUnique({ where: { id } })
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    }

    // For public exercises: only allow updating isUnilateral, isTimed, and isBodyweight flags
    if (exercise.isPublic) {
      const updated = await prisma.exercise.update({
        where: { id },
        data: {
          isUnilateral: isUnilateral !== undefined ? isUnilateral : exercise.isUnilateral,
          isTimed: isTimed !== undefined ? isTimed : exercise.isTimed,
          isBodyweight: isBodyweight !== undefined ? isBodyweight : exercise.isBodyweight,
        },
      })
      return NextResponse.json(updated)
    }

    // For custom exercises: verify ownership and allow full editing
    if (exercise.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updated = await prisma.exercise.update({
      where: { id },
      data: {
        name: name || exercise.name,
        description: description !== undefined ? description : exercise.description,
        muscleGroups: muscleGroups || exercise.muscleGroups,
        equipment: equipment || exercise.equipment,
        isUnilateral: isUnilateral !== undefined ? isUnilateral : exercise.isUnilateral,
        isTimed: isTimed !== undefined ? isTimed : exercise.isTimed,
        isBodyweight: isBodyweight !== undefined ? isBodyweight : exercise.isBodyweight,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating exercise:', error)
    return NextResponse.json(
      { error: 'Failed to update exercise' },
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

    // Only allow deleting user's own exercises
    const deleted = await prisma.exercise.deleteMany({
      where: {
        id,
        createdById: session.user.id,
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Exercise not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting exercise:', error)
    return NextResponse.json(
      { error: 'Failed to delete exercise' },
      { status: 500 }
    )
  }
}
