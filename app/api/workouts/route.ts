import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const workoutSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  estimatedDuration: z.number().int().positive().optional(),
  notes: z.string().optional(),
  microcycleId: z.string(),
  exercises: z.array(z.object({
    exerciseId: z.string(),
    orderIndex: z.number().int(),
    targetSets: z.number().int().positive(),
    targetReps: z.string(),
    targetRpe: z.number().optional(),
    notes: z.string().optional(),
    restPeriod: z.number().int().optional(),
  })).optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = workoutSchema.parse(body)

    // Verify the microcycle belongs to the user
    const microcycle = await prisma.microcycle.findFirst({
      where: {
        id: data.microcycleId,
        mesocycle: {
          macrocycle: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!microcycle) {
      return NextResponse.json(
        { error: 'Microcycle not found' },
        { status: 404 }
      )
    }

    // Auto-label duplicate workout names (e.g., "Lower" → "Lower A", "Lower B")
    const existingWorkouts = await prisma.workout.findMany({
      where: { microcycleId: data.microcycleId },
      select: { name: true },
    })

    let workoutName = data.name
    const baseName = data.name.replace(/\s+[A-Z]$/, '') // Remove existing A/B/C suffix if present
    const duplicates = existingWorkouts.filter((w) => {
      const wBaseName = w.name.replace(/\s+[A-Z]$/, '')
      return wBaseName.toLowerCase() === baseName.toLowerCase()
    })

    if (duplicates.length > 0) {
      // Find the next available letter
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const usedLetters = new Set(
        duplicates
          .map((w) => w.name.match(/\s+([A-Z])$/)?.[1])
          .filter(Boolean)
      )

      // If first duplicate doesn't have a letter yet, it becomes "A"
      if (duplicates.length === 1 && !usedLetters.size) {
        // Rename the existing workout to add "A"
        const existingWorkout = await prisma.workout.findFirst({
          where: {
            microcycleId: data.microcycleId,
            name: duplicates[0].name,
          },
        })
        if (existingWorkout) {
          await prisma.workout.update({
            where: { id: existingWorkout.id },
            data: { name: `${baseName} A` },
          })
        }
        workoutName = `${baseName} B`
      } else {
        // Find next available letter
        for (const letter of letters) {
          if (!usedLetters.has(letter)) {
            workoutName = `${baseName} ${letter}`
            break
          }
        }
      }
    }

    // Create workout with exercises
    const workout = await prisma.workout.create({
      data: {
        name: workoutName,
        description: data.description,
        dayOfWeek: data.dayOfWeek,
        estimatedDuration: data.estimatedDuration,
        notes: data.notes,
        microcycleId: data.microcycleId,
        workoutExercises: data.exercises ? {
          create: data.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            orderIndex: ex.orderIndex,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetRpe: ex.targetRpe,
            notes: ex.notes,
            restPeriod: ex.restPeriod,
          })),
        } : undefined,
      },
      include: {
        workoutExercises: {
          include: {
            exercise: true,
          },
        },
      },
    })

    return NextResponse.json(workout, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating workout:', error)
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    )
  }
}
