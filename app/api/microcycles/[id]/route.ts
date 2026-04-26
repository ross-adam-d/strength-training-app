import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachMesocycleAccess } from '@/lib/coachAccess'

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

    // Optimized: Use select instead of include, minimal nested data
    const microcycle = await prisma.microcycle.findFirst({
      where: {
        id,
        mesocycle: {
          macrocycle: {
            userId: session.user.id,
          },
        },
      },
      select: {
        id: true,
        weekNumber: true,
        startDate: true,
        endDate: true,
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
          select: {
            id: true,
            name: true,
            dayOfWeek: true,
            estimatedDuration: true,
            workoutExercises: {
              orderBy: {
                orderIndex: 'asc',
              },
              select: {
                id: true,
                targetSets: true,
                targetReps: true,
                supersetWithPrevious: true,
                exercise: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            // Only fetch if workout is completed (just need ID and date)
            workoutLogs: {
              orderBy: { completedAt: 'desc' },
              take: 1,
              select: {
                id: true,
                completedAt: true,
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

    // Cache for 2 minutes
    return NextResponse.json(microcycle, {
      headers: {
        'Cache-Control': 'private, s-maxage=120, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Error fetching microcycle:', error)
    return NextResponse.json(
      { error: 'Failed to fetch microcycle' },
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
    const { isRecovery } = body
    if (typeof isRecovery !== 'boolean') {
      return NextResponse.json({ error: 'isRecovery must be a boolean' }, { status: 400 })
    }

    // Resolve mesocycleId to check coach access
    const stub = await prisma.microcycle.findUnique({
      where: { id },
      select: { mesocycleId: true },
    })
    if (!stub) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 })
    }

    const isCoach = session.user.role === 'COACH'
    const coachAccess = isCoach ? await verifyCoachMesocycleAccess(session.user.id, stub.mesocycleId) : false
    const ownershipWhere = isCoach && coachAccess
      ? { id }
      : { id, mesocycle: { macrocycle: { userId: session.user.id } } }

    const microcycle = await prisma.microcycle.findFirst({
      where: ownershipWhere,
      select: {
        id: true,
        workouts: {
          select: {
            workoutExercises: { select: { id: true, targetSets: true } },
          },
        },
      },
    })

    if (!microcycle) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 })
    }

    await prisma.microcycle.update({ where: { id }, data: { isRecovery } })

    // When marking as deload, immediately reduce all sets to 60% (min 1)
    if (isRecovery) {
      for (const workout of microcycle.workouts) {
        for (const we of workout.workoutExercises) {
          await prisma.workoutExercise.update({
            where: { id: we.id },
            data: { targetSets: Math.max(1, Math.floor(we.targetSets * 0.6)) },
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating microcycle:', error)
    return NextResponse.json({ error: 'Failed to update week' }, { status: 500 })
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
