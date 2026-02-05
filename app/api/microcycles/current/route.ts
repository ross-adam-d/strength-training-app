import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find the currently active microcycle
    const activeMicrocycle = await prisma.microcycle.findFirst({
      where: {
        mesocycle: {
          macrocycle: {
            userId: session.user.id,
            status: 'active',
          },
        },
        startDate: {
          lte: now,
        },
        endDate: {
          gt: now,
        },
      },
      orderBy: {
        startDate: 'desc',
      },
      select: {
        id: true,
        name: true,
        weekNumber: true,
        mesocycle: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!activeMicrocycle) {
      return NextResponse.json({ error: 'No active phase found' }, { status: 404 })
    }

    return NextResponse.json(activeMicrocycle)
  } catch (error) {
    console.error('Error fetching current microcycle:', error)
    return NextResponse.json(
      { error: 'Failed to fetch current microcycle' },
      { status: 500 }
    )
  }
}
