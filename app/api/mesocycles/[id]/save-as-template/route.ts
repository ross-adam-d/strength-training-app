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
        take: 1,
        select: {
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
                  restPeriod: true,
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

  const week1 = mesocycle.microcycles[0]
  if (!week1 || week1.workouts.length === 0) {
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
      workouts: {
        create: week1.workouts.map((w, i) => ({
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
              restPeriod: ex.restPeriod ?? undefined,
              notes: ex.notes ?? undefined,
            })),
          },
        })),
      },
    },
    select: { id: true, name: true },
  })

  return NextResponse.json(template, { status: 201 })
}
