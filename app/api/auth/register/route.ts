import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendVerificationEmail } from '@/lib/email'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  inviteToken: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, inviteToken } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Validate invite token before creating the user (fail fast on bad token)
    let validInvite: { token: string; coachId: string } | null = null
    if (inviteToken) {
      const invite = await prisma.coachInvite.findUnique({
        where: { token: inviteToken },
        select: { token: true, coachId: true, email: true, expiresAt: true, acceptedAt: true },
      })
      if (
        invite &&
        !invite.acceptedAt &&
        invite.expiresAt > new Date() &&
        invite.email.toLowerCase() === email.toLowerCase()
      ) {
        validInvite = { token: invite.token, coachId: invite.coachId }
      }
    }

    // Create user, profile, and trial subscription
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 28)

    // Invite registrations are auto-verified (email proven via invite link)
    const emailVerifiedAt = validInvite ? new Date() : undefined

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerified: emailVerifiedAt,
        profile: {
          create: {},
        },
        subscription: {
          create: {
            status: 'TRIALING',
            trialEndsAt,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    // Accept invite and create coaching relationship if token was valid
    if (validInvite) {
      await prisma.$transaction([
        prisma.coachInvite.update({
          where: { token: validInvite.token },
          data: { acceptedAt: new Date() },
        }),
        prisma.coachClientRelationship.create({
          data: {
            coachId: validInvite.coachId,
            clientId: user.id,
            status: 'ACTIVE',
          },
        }),
      ])
    }

    // Send verification email for regular (non-invite) registrations
    if (!validInvite) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const verificationToken = await prisma.emailVerificationToken.create({
        data: { userId: user.id, expiresAt },
      })
      const verifyUrl = `${(process.env.NEXTAUTH_URL ?? '').trim()}/api/auth/verify-email?token=${verificationToken.token}`
      sendVerificationEmail({ toEmail: user.email, name, verifyUrl }).catch((err) =>
        console.error('Failed to send verification email:', err)
      )
    }

    return NextResponse.json(
      { message: 'User created successfully', user, inviteAccepted: !!validInvite },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}
