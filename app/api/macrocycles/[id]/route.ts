import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachBlockAccess } from '@/lib/coachAccess'
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try user ownership first; fall back to coach block access
    let whereId: any = { id, userId: session.user.id }
    if (session.user.role === 'COACH') {
      const coachAccess = await verifyCoachBlockAccess(session.user.id, id)
      if (coachAccess) whereId = { id }
    }

    // Optimized: Use select instead of include, only fetch needed fields
    const macrocycle = await prisma.macrocycle.findFirst({
      where: whereId,
      select: {
        id: true,
        userId: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        description: true,
        goals: true,
        createdByCoachId: true,
        mesocycles: {
          orderBy: {
            startDate: 'asc',
          },
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            goal: true,
            trainingDaysPerWeek: true,
            trainingSplit: true,
            microcycles: {
              select: {
                id: true,
                weekNumber: true,
                workouts: {
                  take: 1,
                  select: { id: true },
                },
              },
              orderBy: {
                weekNumber: 'asc',
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

    // Add cache headers (5 minutes - training blocks don't change frequently)
    return NextResponse.json(macrocycle, {
      headers: {
        'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
      },
    })
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = macrocycleSchema.parse(body)

    // Determine ownership: user or coach creator
    const isCoach = session.user.role === 'COACH'
    let coachHasAccess = false
    if (isCoach) {
      coachHasAccess = await verifyCoachBlockAccess(session.user.id, id)
    }

    // Validate: Only one active training block allowed (check against the block owner)
    if (data.status === 'active') {
      // Find owner userId for this block
      const blockOwner = await prisma.macrocycle.findFirst({
        where: isCoach && coachHasAccess
          ? { id }
          : { id, userId: session.user.id },
        select: { userId: true },
      })
      if (!blockOwner) {
        return NextResponse.json({ error: 'Macrocycle not found' }, { status: 404 })
      }
      const existingActive = await prisma.macrocycle.findFirst({
        where: {
          userId: blockOwner.userId,
          status: 'active',
          NOT: { id },
        },
      })
      if (existingActive) {
        return NextResponse.json(
          { error: 'There is already an active training block. Please set it to completed or paused before activating another.' },
          { status: 400 }
        )
      }
    }

    const updateData: any = { ...data }
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)

    const whereClause = isCoach && coachHasAccess
      ? { id }
      : { id, userId: session.user.id }

    const macrocycle = await prisma.macrocycle.updateMany({
      where: whereClause,
      data: updateData,
    })

    if (macrocycle.count === 0) {
      return NextResponse.json(
        { error: 'Macrocycle not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.macrocycle.findUnique({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let deleteWhere: any = { id, userId: session.user.id }
    if (session.user.role === 'COACH') {
      const coachAccess = await verifyCoachBlockAccess(session.user.id, id)
      if (coachAccess) deleteWhere = { id }
    }

    const deleted = await prisma.macrocycle.deleteMany({
      where: deleteWhere,
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
