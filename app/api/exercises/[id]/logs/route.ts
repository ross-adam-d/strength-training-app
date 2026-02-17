import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since') // ISO date string

    const logs = await prisma.exerciseLog.findMany({
      where: {
        exerciseId: id,
        skipped: false,
        workoutLog: {
          userId: session.user.id,
          ...(since ? { completedAt: { gte: new Date(since) } } : {}),
        },
      },
      orderBy: {
        workoutLog: {
          completedAt: 'asc',
        },
      },
      include: {
        workoutLog: {
          select: {
            completedAt: true,
          },
        },
      },
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching exercise logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercise logs' },
      { status: 500 }
    )
  }
}
