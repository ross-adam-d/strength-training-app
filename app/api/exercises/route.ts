import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const exerciseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  muscleGroups: z.array(z.enum([
    'chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes',
    'adductors', 'abductors', 'biceps', 'triceps', 'forearms', 'core', 'calves',
  ])),
  equipment: z.array(z.string()),
  videoUrl: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isPublic: z.boolean().default(false),
  isUnilateral: z.boolean().default(false),
  isTimed: z.boolean().default(false),
  isBodyweight: z.boolean().default(false),
  needsReview: z.boolean().default(false),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const muscleGroup = searchParams.get('muscleGroup')
    const equipment = searchParams.get('equipment')
    const search = searchParams.get('search')
    const logged = searchParams.get('logged') === 'true'

    const where: any = {
      OR: [
        { isPublic: true },
      ],
    }

    // Add user's private exercises if authenticated
    const session = await getServerSession(authOptions)
    if (session?.user?.id) {
      where.OR.push({ createdById: session.user.id })
    }

    // Filter by muscle group
    if (muscleGroup) {
      where.muscleGroups = {
        has: muscleGroup,
      }
    }

    // Filter by equipment
    if (equipment) {
      where.equipment = {
        has: equipment,
      }
    }

    // Search by name
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Only return exercises the current user has actually logged
    if (logged && session?.user?.id) {
      where.exerciseLogs = {
        some: {
          workoutLog: { userId: session.user.id },
        },
      }
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        muscleGroups: true,
        equipment: true,
        isPublic: true,
        isUnilateral: true,
        isTimed: true,
        isBodyweight: true,
        needsReview: true,
        createdById: true,
      },
    })

    // Cache for 10 minutes - exercises don't change frequently
    return NextResponse.json(exercises, {
      headers: {
        'Cache-Control': 'private, s-maxage=600, stale-while-revalidate=1200',
      },
    })
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
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
    const data = exerciseSchema.parse(body)

    const exercise = await prisma.exercise.create({
      data: {
        ...data,
        videoUrl: data.videoUrl || null,
        imageUrl: data.imageUrl || null,
        createdById: session.user.id,
      },
    })

    return NextResponse.json(exercise, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating exercise:', error)
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    )
  }
}
