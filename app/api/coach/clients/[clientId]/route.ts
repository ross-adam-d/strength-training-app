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

  const [client, relationship] = await Promise.all([
    prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        workoutLogs: {
          orderBy: { completedAt: 'desc' },
          take: 1,
          select: { completedAt: true, duration: true },
        },
        macrocycles: {
          where: { status: 'active' },
          take: 1,
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            mesocycles: {
              orderBy: { startDate: 'asc' },
              take: 1,
              select: { id: true, name: true, status: true },
            },
          },
        },
        _count: {
          select: { workoutLogs: true, macrocycles: true },
        },
      },
    }),
    prisma.coachClientRelationship.findUnique({
      where: { coachId_clientId: { coachId: session.user.id, clientId } },
      select: { status: true, createdAt: true },
    }),
  ])

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  return NextResponse.json({ client, relationship })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { clientId } = await params
  const body = await request.json()
  const { status } = body

  if (!['PAUSED', 'ENDED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updated = await prisma.coachClientRelationship.updateMany({
    where: { coachId: session.user.id, clientId },
    data: { status },
  })

  if (updated.count === 0) {
    return NextResponse.json({ error: 'Relationship not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
