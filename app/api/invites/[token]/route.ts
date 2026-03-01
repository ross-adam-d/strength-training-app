import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const invite = await prisma.coachInvite.findUnique({
    where: { token },
    include: {
      coach: { select: { id: true, name: true, email: true } },
    },
  })

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This invite has expired.' }, { status: 410 })
  }

  if (invite.acceptedAt) {
    return NextResponse.json({ error: 'This invite has already been used.' }, { status: 410 })
  }

  return NextResponse.json({
    token: invite.token,
    email: invite.email,
    expiresAt: invite.expiresAt,
    coach: invite.coach,
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token } = await params
  const body = await request.json()
  const { action } = body // 'accept' | 'decline'

  const invite = await prisma.coachInvite.findUnique({
    where: { token },
    include: {
      coach: { select: { id: true, name: true, email: true } },
    },
  })

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This invite has expired.' }, { status: 410 })
  }

  if (invite.acceptedAt) {
    return NextResponse.json({ error: 'This invite has already been used.' }, { status: 410 })
  }

  // Verify the logged-in user's email matches the invite
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  })

  if (user?.email.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: 'This invite was sent to a different email address.' },
      { status: 403 }
    )
  }

  if (action === 'decline') {
    await prisma.coachInvite.update({
      where: { token },
      data: { acceptedAt: new Date() }, // mark consumed to prevent reuse
    })
    return NextResponse.json({ success: true, action: 'declined' })
  }

  if (action !== 'accept') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Accept: create relationship and mark invite consumed
  await prisma.$transaction([
    prisma.coachInvite.update({
      where: { token },
      data: { acceptedAt: new Date() },
    }),
    prisma.coachClientRelationship.create({
      data: {
        coachId: invite.coachId,
        clientId: session.user.id,
        status: 'ACTIVE',
      },
    }),
  ])

  return NextResponse.json({ success: true, action: 'accepted' })
}
