import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachMesocycleAccess } from '@/lib/coachAccess'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isCoach = session.user.role === 'COACH'
    const coachAccess = isCoach ? await verifyCoachMesocycleAccess(session.user.id, id) : false
    const where = isCoach && coachAccess
      ? { id }
      : { id, macrocycle: { userId: session.user.id } }

    const phase = await prisma.mesocycle.findFirst({
      where,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        macrocycleId: true,
        status: true,
        macrocycle: { select: { userId: true } },
        microcycles: {
          orderBy: { weekNumber: 'asc' },
          select: {
            id: true,
            endDate: true,
            workouts: {
              select: {
                id: true,
                workoutLogs: { select: { id: true }, take: 1 },
              },
            },
          },
        },
      },
    })

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    if (phase.status === 'completed') {
      return NextResponse.json({ error: 'Phase is already completed' }, { status: 400 })
    }

    const now = new Date()
    const blockOwnerId = phase.macrocycle.userId

    // Skip all incomplete workouts sequentially (PgBouncer constraint)
    for (const micro of phase.microcycles) {
      for (const workout of micro.workouts) {
        if (workout.workoutLogs.length === 0) {
          await prisma.workoutLog.create({
            data: {
              workoutId: workout.id,
              userId: blockOwnerId,
              skipped: true,
              notes: 'Phase ended early',
            },
          })
        }
      }
    }

    const savedDays = Math.round((phase.endDate.getTime() - now.getTime()) / 86400000)

    if (savedDays > 0) {
      // Compress phase to today (also compress startDate if phase hasn't started yet)
      const phaseUpdate: { endDate: Date; status: string; startDate?: Date } = {
        endDate: now,
        status: 'completed',
      }
      if (phase.startDate > now) phaseUpdate.startDate = now

      await prisma.mesocycle.update({ where: { id }, data: phaseUpdate })

      // Compress future microcycles within this phase
      await prisma.microcycle.updateMany({
        where: { mesocycleId: id, endDate: { gt: now } },
        data: { endDate: now },
      })

      // Shift all subsequent phases and their microcycles
      const laterPhases = await prisma.mesocycle.findMany({
        where: {
          macrocycleId: phase.macrocycleId,
          startDate: { gt: phase.startDate },
          id: { not: id },
        },
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
          microcycles: { select: { id: true, startDate: true, endDate: true } },
        },
      })

      for (const laterPhase of laterPhases) {
        await prisma.mesocycle.update({
          where: { id: laterPhase.id },
          data: {
            startDate: new Date(laterPhase.startDate.getTime() - savedDays * 86400000),
            endDate: new Date(laterPhase.endDate.getTime() - savedDays * 86400000),
          },
        })
        for (const micro of laterPhase.microcycles) {
          await prisma.microcycle.update({
            where: { id: micro.id },
            data: {
              startDate: new Date(micro.startDate.getTime() - savedDays * 86400000),
              endDate: new Date(micro.endDate.getTime() - savedDays * 86400000),
            },
          })
        }
      }

      // Activate the next planned phase
      if (laterPhases.length > 0) {
        await prisma.mesocycle.updateMany({
          where: { id: laterPhases[0].id, status: 'planned' },
          data: { status: 'active' },
        })
      }
    } else {
      // Phase at or past planned end — just mark complete
      await prisma.mesocycle.update({ where: { id }, data: { status: 'completed' } })

      // Activate next planned phase
      const nextPhase = await prisma.mesocycle.findFirst({
        where: {
          macrocycleId: phase.macrocycleId,
          startDate: { gt: phase.startDate },
          status: 'planned',
          id: { not: id },
        },
        orderBy: { startDate: 'asc' },
      })
      if (nextPhase) {
        await prisma.mesocycle.update({ where: { id: nextPhase.id }, data: { status: 'active' } })
      }
    }

    // Update macrocycle endDate to match the last phase
    const lastPhase = await prisma.mesocycle.findFirst({
      where: { macrocycleId: phase.macrocycleId },
      orderBy: { endDate: 'desc' },
      select: { endDate: true },
    })
    if (lastPhase) {
      await prisma.macrocycle.update({
        where: { id: phase.macrocycleId },
        data: { endDate: lastPhase.endDate },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error ending phase early:', error)
    return NextResponse.json({ error: 'Failed to end phase' }, { status: 500 })
  }
}
