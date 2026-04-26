import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachMesocycleAccess } from '@/lib/coachAccess'
import { z } from 'zod'

const updateMesocycleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  focus: z.string().optional(),
  goal: z.string().optional(),
  trainingDaysPerWeek: z.number().int().min(1).max(7).optional(),
  trainingSplit: z.string().optional(),
  warmupNotes: z.string().optional(),
  status: z.enum(['planned', 'active', 'completed']).optional(),
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

    // Try user ownership first; fall back to coach access
    let getWhere: any = { id, macrocycle: { userId: session.user.id } }
    if (session.user.role === 'COACH') {
      const coachAccess = await verifyCoachMesocycleAccess(session.user.id, id)
      if (coachAccess) getWhere = { id }
    }

    // Optimized: Reduced nesting depth, only select needed fields
    const mesocycle = await prisma.mesocycle.findFirst({
      where: getWhere,
      select: {
        id: true,
        name: true,
        focus: true,
        goal: true,
        trainingDaysPerWeek: true,
        trainingSplit: true,
        startDate: true,
        endDate: true,
        warmupNotes: true,
        macrocycle: {
          select: {
            id: true,
            name: true,
          },
        },
        microcycles: {
          orderBy: {
            weekNumber: 'asc',
          },
          select: {
            id: true,
            weekNumber: true,
            startDate: true,
            endDate: true,
            isRecovery: true,
            workouts: {
              orderBy: {
                dayOfWeek: 'asc',
              },
              select: {
                id: true,
                name: true,
                dayOfWeek: true,
                warmupNotes: true,
                workoutExercises: {
                  orderBy: {
                    orderIndex: 'asc',
                  },
                  select: {
                    id: true,
                    orderIndex: true,
                    targetSets: true,
                    targetReps: true,
                    targetRpe: true,
                    targetRir: true,
                    supersetWithPrevious: true,
                    exercise: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
                workoutLogs: {
                  select: {
                    id: true,
                    completedAt: true,
                    skipped: true,
                  },
                  orderBy: {
                    completedAt: 'desc',
                  },
                  take: 1,
                },
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

    // Add cache headers (5 minutes)
    return NextResponse.json(mesocycle, {
      headers: {
        'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
      },
    })
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

    // Verify ownership (user or coach creator)
    const isCoach = session.user.role === 'COACH'
    const coachAccess = isCoach ? await verifyCoachMesocycleAccess(session.user.id, id) : false
    const patchWhere = isCoach && coachAccess
      ? { id }
      : { id, macrocycle: { userId: session.user.id } }

    const existing = await prisma.mesocycle.findFirst({ where: patchWhere })
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

    let deleteWhere: any = { id, macrocycle: { userId: session.user.id } }
    if (session.user.role === 'COACH') {
      const coachAccess = await verifyCoachMesocycleAccess(session.user.id, id)
      if (coachAccess) deleteWhere = { id }
    }

    const deleted = await prisma.mesocycle.deleteMany({
      where: deleteWhere,
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
