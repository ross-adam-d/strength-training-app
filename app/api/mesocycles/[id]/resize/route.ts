import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachMesocycleAccess } from '@/lib/coachAccess'
import { z } from 'zod'

const resizeSchema = z.object({
  weekCount: z.number().int().min(1).max(16),
})

export async function POST(
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
    const { weekCount } = resizeSchema.parse(body)

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
        microcycles: {
          orderBy: { weekNumber: 'asc' },
          select: {
            id: true,
            weekNumber: true,
            startDate: true,
            endDate: true,
            isRecovery: true,
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
      return NextResponse.json({ error: 'Cannot resize a completed phase' }, { status: 400 })
    }

    const currentCount = phase.microcycles.length
    if (weekCount === currentCount) {
      return NextResponse.json({ success: true, changed: false })
    }

    const dayDiff = (weekCount - currentCount) * 7

    if (weekCount < currentCount) {
      // Removing weeks — validate no logs in weeks being removed
      const weeksToRemove = phase.microcycles.slice(weekCount)
      for (const micro of weeksToRemove) {
        const hasLogs = micro.workouts.some((w) => w.workoutLogs.length > 0)
        if (hasLogs) {
          return NextResponse.json(
            { error: `Week ${micro.weekNumber} has logged workouts and can't be removed` },
            { status: 400 }
          )
        }
      }

      await prisma.microcycle.deleteMany({
        where: { id: { in: weeksToRemove.map((m) => m.id) } },
      })
    } else {
      // Adding weeks — prepopulate workouts from week 1 of this phase
      const lastMicro = phase.microcycles[phase.microcycles.length - 1]
      const firstMicro = phase.microcycles[0]

      const sourceWorkouts = firstMicro
        ? await prisma.workout.findMany({
            where: { microcycleId: firstMicro.id },
            orderBy: { orderIndex: 'asc' },
            select: {
              name: true,
              dayOfWeek: true,
              estimatedDuration: true,
              warmupNotes: true,
              orderIndex: true,
              workoutExercises: {
                orderBy: { orderIndex: 'asc' },
                select: {
                  exerciseId: true,
                  orderIndex: true,
                  targetSets: true,
                  targetReps: true,
                  targetRpe: true,
                  targetRir: true,
                  tempo: true,
                  restPeriod: true,
                  supersetWithPrevious: true,
                  notes: true,
                },
              },
            },
          })
        : []

      const weeksToAdd = weekCount - currentCount
      for (let i = 0; i < weeksToAdd; i++) {
        const weekNum = currentCount + i + 1
        const weekStart = new Date(lastMicro.endDate.getTime() + (i * 7 + 1) * 86400000)
        const weekEnd = new Date(lastMicro.endDate.getTime() + (i + 1) * 7 * 86400000)

        const newMicro = await prisma.microcycle.create({
          data: {
            name: `Week ${weekNum}`,
            weekNumber: weekNum,
            startDate: weekStart,
            endDate: weekEnd,
            isRecovery: false,
            mesocycleId: phase.id,
          },
        })

        // Sequential creates per PgBouncer constraint
        for (const sourceWorkout of sourceWorkouts) {
          await prisma.workout.create({
            data: {
              name: sourceWorkout.name,
              dayOfWeek: sourceWorkout.dayOfWeek,
              estimatedDuration: sourceWorkout.estimatedDuration,
              warmupNotes: sourceWorkout.warmupNotes,
              orderIndex: sourceWorkout.orderIndex,
              microcycleId: newMicro.id,
              workoutExercises: {
                create: sourceWorkout.workoutExercises.map((we) => ({
                  exerciseId: we.exerciseId,
                  orderIndex: we.orderIndex,
                  targetSets: we.targetSets,
                  targetReps: we.targetReps,
                  targetRpe: we.targetRpe,
                  targetRir: we.targetRir,
                  tempo: we.tempo,
                  restPeriod: we.restPeriod,
                  supersetWithPrevious: we.supersetWithPrevious,
                  notes: we.notes,
                })),
              },
            },
          })
        }
      }
    }

    // Update phase endDate
    const newPhaseEnd = new Date(phase.endDate.getTime() + dayDiff * 86400000)
    await prisma.mesocycle.update({
      where: { id },
      data: { endDate: newPhaseEnd },
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
        microcycles: { select: { id: true, startDate: true, endDate: true } },
      },
    })

    for (const laterPhase of laterPhases) {
      await prisma.mesocycle.update({
        where: { id: laterPhase.id },
        data: {
          startDate: new Date(laterPhase.startDate.getTime() + dayDiff * 86400000),
          endDate: new Date(laterPhase.endDate.getTime() + dayDiff * 86400000),
        },
      })
      for (const micro of laterPhase.microcycles) {
        await prisma.microcycle.update({
          where: { id: micro.id },
          data: {
            startDate: new Date(micro.startDate.getTime() + dayDiff * 86400000),
            endDate: new Date(micro.endDate.getTime() + dayDiff * 86400000),
          },
        })
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

    return NextResponse.json({ success: true, dayDiff })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error resizing phase:', error)
    return NextResponse.json({ error: 'Failed to resize phase' }, { status: 500 })
  }
}
