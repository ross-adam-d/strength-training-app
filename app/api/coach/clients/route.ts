import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendCoachInvite } from '@/lib/email'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const relationships = await prisma.coachClientRelationship.findMany({
    where: { coachId: session.user.id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          workoutLogs: {
            orderBy: { completedAt: 'desc' },
            take: 1,
            select: { completedAt: true },
          },
          macrocycles: {
            where: { status: 'active' },
            take: 1,
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(relationships)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Check seat limit (active relationships only — pending invites don't consume seats until accepted)
  const [coachProfile, relationshipCount] = await Promise.all([
    prisma.coachProfile.findUnique({ where: { userId: session.user.id }, select: { maxClients: true } }),
    prisma.coachClientRelationship.count({ where: { coachId: session.user.id, status: { in: ['ACTIVE', 'PENDING'] } } }),
  ])

  const maxClients = coachProfile?.maxClients ?? 5
  if (relationshipCount >= maxClients) {
    return NextResponse.json({ error: `You have reached your client limit of ${maxClients}.` }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Don't invite yourself
  if (session.user.email?.toLowerCase() === normalizedEmail) {
    return NextResponse.json({ error: 'You cannot invite yourself.' }, { status: 400 })
  }

  // Check for existing pending invite to this email
  const existingInvite = await prisma.coachInvite.findFirst({
    where: { coachId: session.user.id, email: normalizedEmail, acceptedAt: null, expiresAt: { gt: new Date() } },
  })
  if (existingInvite) {
    return NextResponse.json({ error: 'A pending invite already exists for this email.' }, { status: 400 })
  }

  // If user already has an account, check for existing relationship
  const targetUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true },
  })

  if (targetUser) {
    if (targetUser.id === session.user.id) {
      return NextResponse.json({ error: 'You cannot invite yourself.' }, { status: 400 })
    }
    const existingRelationship = await prisma.coachClientRelationship.findUnique({
      where: { coachId_clientId: { coachId: session.user.id, clientId: targetUser.id } },
    })
    if (existingRelationship) {
      return NextResponse.json({ error: 'A relationship with this client already exists.' }, { status: 400 })
    }
  }

  // Create invite token
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  const invite = await prisma.coachInvite.create({
    data: {
      coachId: session.user.id,
      email: normalizedEmail,
      expiresAt,
    },
  })

  const coach = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://strength-training-app.vercel.app'
  const inviteUrl = `${baseUrl}/invites/${invite.token}`

  // Send email — non-fatal: invite is already created, return URL for manual sharing if email fails
  let emailSent = true
  try {
    await sendCoachInvite({
      toEmail: email,
      coachName: coach?.name ?? coach?.email ?? 'Your coach',
      inviteUrl,
    })
  } catch (err) {
    console.error('Failed to send invite email:', err)
    emailSent = false
  }

  return NextResponse.json({ success: true, inviteUrl, emailSent })
}
