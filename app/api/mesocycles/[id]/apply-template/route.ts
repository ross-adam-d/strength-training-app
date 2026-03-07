import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachMesocycleAccess } from '@/lib/coachAccess'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { templateId } = body

  if (!templateId) {
    return NextResponse.json({ error: 'templateId is required' }, { status: 400 })
  }

  // Verify coach owns the template
  const template = await prisma.coachPhaseTemplate.findFirst({
    where: { id: templateId, coachId: session.user.id },
    select: {
      trainingSplit: true,
      daysPerWeek: true,
      workouts: {
        orderBy: { orderIndex: 'asc' },
        select: {
          name: true,
          orderIndex: true,
          exercises: {
            orderBy: { orderIndex: 'asc' },
            select: {
              exerciseId: true,
              orderIndex: true,
              targetSets: true,
              targetReps: true,
              targetRpe: true,
              targetRir: true,
              restPeriod: true,
              notes: true,
            },
          },
        },
      },
    },
  })

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  // Verify coach access to the mesocycle
  const hasCoachAccess = await verifyCoachMesocycleAccess(session.user.id, id)
  const where = hasCoachAccess
    ? { id }
    : { id, macrocycle: { userId: session.user.id } }

  const mesocycle = await prisma.mesocycle.findFirst({
    where,
    select: {
      id: true,
      microcycles: {
        orderBy: { weekNumber: 'asc' },
        select: { id: true, weekNumber: true, isRecovery: true },
      },
    },
  })

  if (!mesocycle) {
    return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
  }

  // Clear any existing workouts
  const microcycleIds = mesocycle.microcycles.map((m) => m.id)
  await prisma.workout.deleteMany({ where: { microcycleId: { in: microcycleIds } } })

  // Clone template workouts into each microcycle sequentially (PgBouncer safe)
  for (const microcycle of mesocycle.microcycles) {
    for (const tWorkout of template.workouts) {
      await prisma.workout.create({
        data: {
          name: tWorkout.name,
          orderIndex: tWorkout.orderIndex,
          microcycleId: microcycle.id,
          workoutExercises: {
            create: tWorkout.exercises.map((tex) => ({
              exerciseId: tex.exerciseId,
              orderIndex: tex.orderIndex,
              targetSets: microcycle.isRecovery
                ? Math.max(1, Math.floor(tex.targetSets * 0.6))
                : tex.targetSets,
              targetReps: tex.targetReps ?? undefined,
              targetRpe: tex.targetRpe ?? undefined,
              targetRir: tex.targetRir ?? undefined,
              restPeriod: tex.restPeriod ?? undefined,
              notes: tex.notes ?? undefined,
            })),
          },
        },
      })
    }
  }

  // Sync mesocycle metadata from template
  await prisma.mesocycle.update({
    where: { id },
    data: {
      trainingSplit: template.trainingSplit ?? undefined,
      trainingDaysPerWeek: template.daysPerWeek ?? undefined,
    },
  })

  return NextResponse.json({ success: true })
}
