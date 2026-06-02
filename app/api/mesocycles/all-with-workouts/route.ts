import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const excludeId = searchParams.get('exclude')

    const macrocycles = await prisma.macrocycle.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: 'desc' },
      select: {
        id: true,
        name: true,
        mesocycles: {
          where: excludeId ? { id: { not: excludeId } } : undefined,
          orderBy: { startDate: 'asc' },
          select: {
            id: true,
            name: true,
            microcycles: {
              select: {
                _count: { select: { workouts: true } },
              },
            },
          },
        },
      },
    })

    const phases = macrocycles.flatMap((mac) =>
      mac.mesocycles
        .filter((m) => m.microcycles.some((mc) => mc._count.workouts > 0))
        .map((m) => ({
          id: m.id,
          name: m.name,
          macycleName: mac.name,
        }))
    )

    return NextResponse.json(phases)
  } catch (error) {
    console.error('Error fetching all phases with workouts:', error)
    return NextResponse.json({ error: 'Failed to fetch phases' }, { status: 500 })
  }
}
