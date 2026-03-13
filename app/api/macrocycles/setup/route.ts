import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const exerciseSlotSchema = z.object({
  exerciseName: z.string(),
  orderIndex: z.number().int(),
  targetSets: z.number().int().positive(),
  targetReps: z.string(),
  notes: z.string().optional(),
  restPeriod: z.number().int().optional(),
})

const workoutSchema = z.object({
  name: z.string(),
  dayOfWeek: z.number().int().min(0).max(6),
  exercises: z.array(exerciseSlotSchema),
})

const microcycleSchema = z.object({
  name: z.string(),
  weekNumber: z.number().int(),
  startDate: z.string(),
  endDate: z.string(),
  isRecovery: z.boolean().optional().default(false),
  workouts: z.array(workoutSchema),
})

const mesocycleSchema = z.object({
  name: z.string(),
  focus: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  microcycles: z.array(microcycleSchema),
})

const setupSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['planned', 'active', 'completed', 'paused']).default('active'),
  availableEquipment: z.array(z.string()).default([]),
  mesocycles: z.array(mesocycleSchema),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Tier-based block limit (enforced post-beta; all users PREMIERE during beta)
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    const tier = token?.tier ?? 'PREMIERE'
    if (tier === 'BASIC') {
      const count = await prisma.macrocycle.count({ where: { userId: session.user.id } })
      if (count >= 2) {
        return NextResponse.json(
          { error: 'Core plan is limited to 2 training blocks. Upgrade to Elite for unlimited.' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const data = setupSchema.parse(body)

    // Validate: Only one active training block allowed
    if (data.status === 'active') {
      const existingActive = await prisma.macrocycle.findFirst({
        where: {
          userId: session.user.id,
          status: 'active',
        },
      })

      if (existingActive) {
        return NextResponse.json(
          { error: 'You already have an active training block. Please set it to completed or paused before creating a new active block.' },
          { status: 400 }
        )
      }
    }

    // Build exercise name → id map
    const exercises = await prisma.exercise.findMany({
      where: { OR: [{ isPublic: true }, { createdById: session.user.id }] },
      select: { id: true, name: true },
    })
    const exerciseMap = new Map(exercises.map((e) => [e.name, e.id]))

    // Validate all exercise names resolve before touching the DB
    for (const meso of data.mesocycles) {
      for (const micro of meso.microcycles) {
        for (const workout of micro.workouts) {
          for (const slot of workout.exercises) {
            if (!exerciseMap.has(slot.exerciseName)) {
              return NextResponse.json(
                { error: `Exercise not found: "${slot.exerciseName}"` },
                { status: 400 }
              )
            }
          }
        }
      }
    }

    // Sequential creates — prisma.$transaction is incompatible with Supabase's PgBouncer pooler
    const macrocycle = await prisma.macrocycle.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status,
        availableEquipment: data.availableEquipment,
        userId: session.user.id,
      },
    })

    for (const mesoData of data.mesocycles) {
      const meso = await prisma.mesocycle.create({
        data: {
          name: mesoData.name,
          focus: mesoData.focus,
          startDate: new Date(mesoData.startDate),
          endDate: new Date(mesoData.endDate),
          macrocycleId: macrocycle.id,
        },
      })

      for (const microData of mesoData.microcycles) {
        const micro = await prisma.microcycle.create({
          data: {
            name: microData.name,
            weekNumber: microData.weekNumber,
            startDate: new Date(microData.startDate),
            endDate: new Date(microData.endDate),
            isRecovery: microData.isRecovery ?? false,
            mesocycleId: meso.id,
          },
        })

        for (const workoutData of microData.workouts) {
          await prisma.workout.create({
            data: {
              name: workoutData.name,
              dayOfWeek: workoutData.dayOfWeek,
              microcycleId: micro.id,
              workoutExercises: {
                create: workoutData.exercises.map((slot) => ({
                  exerciseId: exerciseMap.get(slot.exerciseName)!,
                  orderIndex: slot.orderIndex,
                  targetSets: slot.targetSets,
                  targetReps: slot.targetReps,
                  notes: slot.notes,
                  restPeriod: slot.restPeriod,
                })),
              },
            },
          })
        }
      }
    }

    return NextResponse.json({ id: macrocycle.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating training block:', error)
    return NextResponse.json({ error: 'Failed to create training block' }, { status: 500 })
  }
}
