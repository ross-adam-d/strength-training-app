import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SPLIT_WORKOUT_TYPES: Record<string, string[]> = {
  'Full Body':      ['Full Body'],
  'Upper/Lower':    ['Upper', 'Lower'],
  'Push/Pull':      ['Push', 'Pull'],
  'Push/Pull/Legs': ['Push', 'Pull', 'Legs'],
  'Bro Split':      ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms'],
  'Olympic Lifts':  ['Olympic A', 'Olympic B'],
  'Custom':         ['Workout'],
}

function getWorkoutNamesForSplit(split: string, days: number): string[] {
  const types = SPLIT_WORKOUT_TYPES[split] || ['Workout']
  const raw: string[] = []
  for (let i = 0; i < days; i++) raw.push(types[i % types.length])
  const counts: Record<string, number> = {}
  for (const t of raw) counts[t] = (counts[t] || 0) + 1
  const indices: Record<string, number> = {}
  return raw.map(t => {
    if (counts[t] > 1 && !/\s[A-Z]$/.test(t)) {
      indices[t] = (indices[t] || 0) + 1
      return `${t} ${String.fromCharCode(64 + indices[t])}`
    }
    return t
  })
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  focus: z.string().optional(),
  goal: z.string().optional(),
  trainingSplit: z.string().optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  defaultWeeks: z.number().int().min(1).max(12).default(4),
  warmupNotes: z.string().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const templates = await prisma.coachPhaseTemplate.findMany({
    where: { coachId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      focus: true,
      goal: true,
      trainingSplit: true,
      daysPerWeek: true,
      defaultWeeks: true,
      updatedAt: true,
      _count: { select: { workouts: true } },
    },
  })

  return NextResponse.json(templates)
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createSchema.parse(body)

    const template = await prisma.coachPhaseTemplate.create({
      data: {
        coachId: session.user.id,
        name: data.name,
        description: data.description,
        focus: data.focus,
        goal: data.goal,
        trainingSplit: data.trainingSplit,
        daysPerWeek: data.daysPerWeek,
        defaultWeeks: data.defaultWeeks,
        warmupNotes: data.warmupNotes,
      },
    })

    // Auto-create workout shells based on split + days
    if (data.trainingSplit && data.daysPerWeek) {
      const names = getWorkoutNamesForSplit(data.trainingSplit, data.daysPerWeek)
      for (let i = 0; i < names.length; i++) {
        await prisma.coachPhaseTemplateWorkout.create({
          data: { templateId: template.id, name: names[i], orderIndex: i },
        })
      }
    }

    return NextResponse.json({ id: template.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating phase template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
