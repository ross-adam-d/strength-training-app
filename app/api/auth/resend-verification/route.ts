import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

export async function POST() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.emailVerified) {
    return NextResponse.json({ error: 'Email is already verified' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, emailVerified: true },
  })

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

  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken.token}`
  await sendVerificationEmail({ toEmail: user.email, name: user.name, verifyUrl })

  return NextResponse.json({ message: 'Verification email sent' })
}
