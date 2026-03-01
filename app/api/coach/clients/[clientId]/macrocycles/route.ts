import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCoachClientAccess } from '@/lib/coachAccess'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { clientId } = await params
  const hasAccess = await verifyCoachClientAccess(session.user.id, clientId)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const macrocycles = await prisma.macrocycle.findMany({
    where: { userId: clientId },
    orderBy: { startDate: 'desc' },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      description: true,
      goals: true,
      createdByCoachId: true,
      mesocycles: {
        select: { id: true, name: true, status: true },
        orderBy: { startDate: 'asc' },
      },
    },
  })

  return NextResponse.json(macrocycles)
}
