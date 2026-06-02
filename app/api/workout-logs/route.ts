import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const workoutLogSchema = z.object({
  workoutId: z.string().optional(),
  duration: z.number().int().positive().optional(),
  notes: z.string().optional(),
  overallRating: z.number().int().min(1).max(5).optional(),
  overallRpe: z.number().optional(),
  preWorkoutWellness: z.number().int().min(1).max(5).optional(),
  exerciseLogs: z.array(z.object({
    exerciseId: z.string(),
    setNumber: z.number().int().positive(),
    reps: z.number().int().min(0),
    repsLeft: z.number().int().min(0).optional(),
    repsRight: z.number().int().min(0).optional(),
    weight: z.number().min(0),
    duration: z.number().int().min(0).optional(),
    exerciseRpe: z.number().optional(),
    rir: z.number().int().min(0).optional(),
    skipped: z.boolean().optional(),
    notes: z.string().optional(),
  })),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const workoutLogs = await prisma.workoutLog.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: limit,
      include: {
        workout: {
          select: {
            name: true,
          },
        },
        exerciseLogs: {
          select: {
            exercise: {
              select: {
                name: true,
              },
            },
            weight: true,
            reps: true,
            repsLeft: true,
            repsRight: true,
          },
        },
      },
    })

    return NextResponse.json(workoutLogs)
  } catch (error) {
    console.error('Error fetching workout logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = workoutLogSchema.parse(body)

    // Optimized: Verify ownership with minimal query
    let mesocycleId: string | null = null
    let macrocycleId: string | null = null
    if (data.workoutId) {
      const workout = await prisma.workout.findFirst({
        where: {
          id: data.workoutId,
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
        return NextResponse.json(
          { error: 'Workout not found' },
          { status: 404 }
        )
      }

      mesocycleId = workout.microcycle.mesocycle.id
      macrocycleId = workout.microcycle.mesocycle.macrocycleId
    }

    // Optimized: Create workout log and update status in parallel
    // Don't return nested data - frontend redirects immediately
    const workoutLog = await prisma.workoutLog.create({
      data: {
        workoutId: data.workoutId || null,
        userId: session.user.id,
        duration: data.duration,
        notes: data.notes,
        overallRating: data.overallRating,
        overallRpe: data.overallRpe,
        preWorkoutWellness: data.preWorkoutWellness,
        exerciseLogs: {
          create: data.exerciseLogs.map((log) => ({
            exerciseId: log.exerciseId,
            setNumber: log.setNumber,
            reps: log.reps,
            repsLeft: log.repsLeft,
            repsRight: log.repsRight,
            weight: log.weight,
            duration: log.duration,
            exerciseRpe: log.exerciseRpe,
            rir: log.rir,
            skipped: log.skipped ?? false,
            notes: log.notes,
          })),
        },
      },
      select: {
        id: true,
        completedAt: true,
      },
    })

    // Run status updates in parallel (if needed)
    const statusUpdates = []
    if (mesocycleId) {
      statusUpdates.push(
        prisma.mesocycle.updateMany({
          where: { id: mesocycleId, status: 'planned' },
          data: { status: 'active' },
        })
      )
    }
    if (macrocycleId) {
      statusUpdates.push(
        prisma.macrocycle.updateMany({
          where: { id: macrocycleId, status: 'planned' },
          data: { status: 'active' },
        })
      )
    }

    if (statusUpdates.length > 0) {
      await Promise.all(statusUpdates)
    }

    // Auto-advance: if this workout completes the entire phase, compress dates and activate next phase
    let completedType: 'block' | 'phase' | null = null

    if (mesocycleId && macrocycleId && data.workoutId) {
      const incompleteInPhase = await prisma.workout.count({
        where: {
          microcycle: { mesocycleId },
          workoutLogs: { none: {} },
          id: { not: data.workoutId }, // exclude the one we just logged
        },
      })

      if (incompleteInPhase === 0) {
        // This phase is fully complete — compress dates and shift subsequent phases
        const now = new Date()
        const completedPhase = await prisma.mesocycle.findUnique({
          where: { id: mesocycleId },
          select: { endDate: true, startDate: true },
        })

        if (completedPhase && completedPhase.endDate > now) {
          // Phase finished early — compress endDate to today
          const savedDays = Math.round(
            (completedPhase.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )

          if (savedDays > 0) {
            // Update the completed phase endDate
            await prisma.mesocycle.update({
              where: { id: mesocycleId },
              data: { endDate: now, status: 'completed' },
            })

            // Shift all subsequent phases and their microcycles forward by savedDays
            const laterPhases = await prisma.mesocycle.findMany({
              where: {
                macrocycleId,
                startDate: { gt: completedPhase.startDate },
              },
              orderBy: { startDate: 'asc' },
              select: {
                id: true,
                startDate: true,
                endDate: true,
                microcycles: {
                  select: { id: true, startDate: true, endDate: true },
                },
              },
            })

            for (const phase of laterPhases) {
              const newStart = new Date(phase.startDate.getTime() - savedDays * 86400000)
              const newEnd = new Date(phase.endDate.getTime() - savedDays * 86400000)
              await prisma.mesocycle.update({
                where: { id: phase.id },
                data: { startDate: newStart, endDate: newEnd },
              })
              for (const micro of phase.microcycles) {
                await prisma.microcycle.update({
                  where: { id: micro.id },
                  data: {
                    startDate: new Date(micro.startDate.getTime() - savedDays * 86400000),
                    endDate: new Date(micro.endDate.getTime() - savedDays * 86400000),
                  },
                })
              }
            }

            // Also update the microcycles within the completed phase (compress remaining weeks)
            const completedMicros = await prisma.microcycle.findMany({
              where: { mesocycleId, endDate: { gt: now } },
              select: { id: true },
            })
            if (completedMicros.length > 0) {
              await prisma.microcycle.updateMany({
                where: { id: { in: completedMicros.map((m) => m.id) } },
                data: { endDate: now },
              })
            }

            // Activate the next phase if it exists and is planned
            if (laterPhases.length > 0) {
              await prisma.mesocycle.updateMany({
                where: { id: laterPhases[0].id, status: 'planned' },
                data: { status: 'active' },
              })
            }
          } else {
            // Phase finished on time — just mark complete and activate next
            await prisma.mesocycle.update({
              where: { id: mesocycleId },
              data: { status: 'completed' },
            })
            const nextPhase = await prisma.mesocycle.findFirst({
              where: { macrocycleId, startDate: { gt: completedPhase.startDate }, status: 'planned' },
              orderBy: { startDate: 'asc' },
            })
            if (nextPhase) {
              await prisma.mesocycle.update({
                where: { id: nextPhase.id },
                data: { status: 'active' },
              })
            }
          }
        } else if (completedPhase) {
          // Phase finished at or after planned endDate — just mark complete
          await prisma.mesocycle.update({
            where: { id: mesocycleId },
            data: { status: 'completed' },
          })
          const nextPhase = await prisma.mesocycle.findFirst({
            where: { macrocycleId, startDate: { gt: completedPhase.startDate }, status: 'planned' },
            orderBy: { startDate: 'asc' },
          })
          if (nextPhase) {
            await prisma.mesocycle.update({
              where: { id: nextPhase.id },
              data: { status: 'active' },
            })
          }
        }

        // Check if all phases in the block are now complete — if so, mark the block complete
        const remainingPhases = await prisma.mesocycle.count({
          where: { macrocycleId, status: { not: 'completed' } },
        })
        if (remainingPhases === 0) {
          await prisma.macrocycle.update({
            where: { id: macrocycleId },
            data: { status: 'completed' },
          })
          completedType = 'block'
        } else {
          completedType = 'phase'
        }
      }
    }

    return NextResponse.json({ ...workoutLog, completed: completedType }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating workout log:', error)
    return NextResponse.json(
      { error: 'Failed to create workout log' },
      { status: 500 }
    )
  }
}
