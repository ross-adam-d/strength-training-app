import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reorderSchema = z.object({
  workouts: z.array(
    z.object({
      id: z.string(),
      orderIndex: z.number().int().min(0),
    })
  ),
})

export async function PATCH(
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
    const { workouts } = reorderSchema.parse(body)

    // Verify ownership
    const microcycle = await prisma.microcycle.findFirst({
      where: {
        id,
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

    // Update all workouts in a transaction
    await prisma.$transaction(
      workouts.map((workout) =>
        prisma.workout.update({
          where: { id: workout.id },
          data: { orderIndex: workout.orderIndex },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering workouts:', error)
    return NextResponse.json(
      { error: 'Failed to reorder workouts' },
      { status: 500 }
    )
  }
}
