import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: workoutId } = await params

  // Verify ownership via macrocycle → mesocycle → microcycle → workout chain
  const workout = await prisma.workout.findFirst({
    where: {
      id: workoutId,
      microcycle: {
        mesocycle: {
          macrocycle: {
            userId: session.user.id,
          },
        },
      },
    },
    select: {
      id: true,
      microcycle: {
        select: {
          mesocycle: {
            select: {
              id: true,
              macrocycleId: true,
            },
          },
        },
      },
    },
  })

  if (!workout) {
    return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
  }

  // Check if already logged
  const existing = await prisma.workoutLog.findFirst({
    where: { workoutId, userId: session.user.id },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json(
      { error: 'Workout already has a log entry' },
      { status: 409 }
    )
  }

  // Create skipped workout log (no exercise logs)
  const workoutLog = await prisma.workoutLog.create({
    data: {
      workoutId,
      userId: session.user.id,
      skipped: true,
      notes: 'Skipped',
    },
    select: {
      id: true,
      skipped: true,
    },
  })

  // Promote planned → active (same logic as workout-logs POST)
  const mesocycleId = workout.microcycle.mesocycle.id
  const macrocycleId = workout.microcycle.mesocycle.macrocycleId
  await Promise.all([
    prisma.mesocycle.updateMany({
      where: { id: mesocycleId, status: 'planned' },
      data: { status: 'active' },
    }),
    prisma.macrocycle.updateMany({
      where: { id: macrocycleId, status: 'planned' },
      data: { status: 'active' },
    }),
  ])

  return NextResponse.json(workoutLog, { status: 201 })
}
