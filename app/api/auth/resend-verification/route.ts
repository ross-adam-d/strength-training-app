import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  let user: { id: string; email: string; name: string | null; emailVerified: Date | null } | null = null

  if (session?.user?.id) {
    // Authenticated path
    if (session.user.emailVerified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 })
    }
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, emailVerified: true },
    })
  } else {
    // Unauthenticated path — accept email in body (post-registration flow)
    let email: string | undefined
    try {
      const body = await request.json()
      email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : undefined
    } catch {
      // no body
    }
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, emailVerified: true },
    })
  }

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.emailVerified) {
    return NextResponse.json({ error: 'Email is already verified' }, { status: 400 })
  }

  // Delete all existing tokens, create a fresh one
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } })

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const verificationToken = await prisma.emailVerificationToken.create({
    data: { userId: user.id, expiresAt },
  })

  const verifyUrl = `${(process.env.NEXTAUTH_URL ?? '').trim()}/api/auth/verify-email?token=${verificationToken.token}`
  await sendVerificationEmail({ toEmail: user.email, name: user.name, verifyUrl })

  return NextResponse.json({ message: 'Verification email sent' })
}
