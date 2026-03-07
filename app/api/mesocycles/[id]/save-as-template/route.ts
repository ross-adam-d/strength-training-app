import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachMesocycleAccess } from '@/lib/coachAccess'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Verify access: coach-created client block OR coach's own training
  const hasCoachAccess = await verifyCoachMesocycleAccess(session.user.id, id)
  const where = hasCoachAccess
    ? { id }
    : { id, macrocycle: { userId: session.user.id } }

  const mesocycle = await prisma.mesocycle.findFirst({
    where,
    select: {
      name: true,
      focus: true,
      goal: true,
      trainingSplit: true,
      trainingDaysPerWeek: true,
      _count: { select: { microcycles: true } },
      microcycles: {
        orderBy: { weekNumber: 'asc' },
        select: {
          weekNumber: true,
          workouts: {
            orderBy: { orderIndex: 'asc' },
            select: {
              name: true,
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
          },
        },
      },
    },
  })

  if (!mesocycle) {
    return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
  }

  const hasAnyWorkouts = mesocycle.microcycles.some((mc) => mc.workouts.length > 0)
  if (!hasAnyWorkouts) {
    return NextResponse.json(
      { error: 'Phase has no workouts to save as template' },
      { status: 400 }
    )
  }

  const template = await prisma.coachPhaseTemplate.create({
    data: {
      coachId: session.user.id,
      name: mesocycle.name,
      focus: mesocycle.focus ?? undefined,
      goal: mesocycle.goal ?? undefined,
      trainingSplit: mesocycle.trainingSplit ?? undefined,
      daysPerWeek: mesocycle.trainingDaysPerWeek ?? undefined,
      defaultWeeks: mesocycle._count.microcycles,
    },
    select: { id: true, name: true },
  })

  // Save all weeks' workouts (not just week 1) to preserve progressive structure
  for (const microcycle of mesocycle.microcycles) {
    for (let i = 0; i < microcycle.workouts.length; i++) {
      const w = microcycle.workouts[i]
      await prisma.coachPhaseTemplateWorkout.create({
        data: {
          templateId: template.id,
          weekNumber: microcycle.weekNumber,
          name: w.name,
          orderIndex: w.orderIndex ?? i,
          exercises: {
            create: w.workoutExercises.map((ex, j) => ({
              exerciseId: ex.exerciseId,
              orderIndex: ex.orderIndex ?? j,
              targetSets: ex.targetSets ?? 3,
              targetReps: ex.targetReps ?? undefined,
              targetRpe: ex.targetRpe ?? undefined,
              targetRir: ex.targetRir ?? undefined,
              tempo: ex.tempo ?? undefined,
              restPeriod: ex.restPeriod ?? undefined,
              supersetWithPrevious: ex.supersetWithPrevious ?? false,
              notes: ex.notes ?? undefined,
            })),
          },
        },
      })
    }
  }

  return NextResponse.json(template, { status: 201 })
}
