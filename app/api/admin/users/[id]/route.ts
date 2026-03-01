import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      subscription: true,
      coachProfile: { select: { maxClients: true } },
      macrocycles: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          status: true,
        },
        orderBy: { startDate: 'desc' },
      },
      workoutLogs: {
        select: {
          id: true,
          completedAt: true,
          duration: true,
          overallRpe: true,
          workout: {
            select: { name: true },
          },
        },
        orderBy: { completedAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { role, maxClients } = body

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Handle role change
  if (role === 'COACH') {
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: { role: 'COACH' },
        select: { id: true, role: true },
      })
      const profile = await tx.coachProfile.upsert({
        where: { userId: id },
        create: { userId: id, maxClients: maxClients ?? 5 },
        update: { maxClients: maxClients ?? 5 },
        select: { maxClients: true },
      })
      return { ...u, coachProfile: profile }
    })
    return NextResponse.json(updated)
  }

  if (role === 'USER') {
    const updated = await prisma.user.update({
      where: { id },
      data: { role: 'USER' },
      select: { id: true, role: true },
    })
    return NextResponse.json({ ...updated, coachProfile: null })
  }

  // Update maxClients on existing coach profile
  if (maxClients !== undefined && user.role === 'COACH') {
    const profile = await prisma.coachProfile.update({
      where: { userId: id },
      data: { maxClients },
      select: { maxClients: true },
    })
    return NextResponse.json({ coachProfile: profile })
  }

  return NextResponse.json({ error: 'No valid update provided' }, { status: 400 })
}
