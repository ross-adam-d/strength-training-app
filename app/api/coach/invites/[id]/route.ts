import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendCoachInvite } from '@/lib/email'

// PATCH — resend: refresh expiry + re-send invite email
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const invite = await prisma.coachInvite.findUnique({
    where: { id },
    select: { id: true, coachId: true, email: true, token: true, acceptedAt: true },
  })

  if (!invite || invite.coachId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (invite.acceptedAt) {
    return NextResponse.json({ error: 'Invite already used' }, { status: 410 })
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await prisma.coachInvite.update({ where: { id }, data: { expiresAt } })

  const coach = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  })

  const baseUrl = (process.env.NEXTAUTH_URL ?? '').trim()
  const inviteUrl = `${baseUrl}/invites/${invite.token}`

  let emailSent = true
  try {
    await sendCoachInvite({
      toEmail: invite.email,
      coachName: coach?.name ?? coach?.email ?? 'Your coach',
      inviteUrl,
    })
  } catch (err) {
    console.error('Failed to resend invite email:', err)
    emailSent = false
  }

  return NextResponse.json({ success: true, emailSent, expiresAt })
}

// DELETE — revoke: mark invite as consumed so the link stops working
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const invite = await prisma.coachInvite.findUnique({
    where: { id },
    select: { id: true, coachId: true, acceptedAt: true },
  })

  if (!invite || invite.coachId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.coachInvite.update({
    where: { id },
    data: { acceptedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
