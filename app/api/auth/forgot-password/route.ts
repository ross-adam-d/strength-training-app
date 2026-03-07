import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalised = email.trim().toLowerCase()

    const user = await prisma.user.findUnique({
      where: { email: normalised },
      select: { id: true, email: true, name: true },
    })

    // Always return success — don't reveal whether account exists
    if (!user) {
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent' })
    }

    // Delete any existing unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    })

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    const resetToken = await prisma.passwordResetToken.create({
      data: { userId: user.id, expiresAt },
    })

    const resetUrl = `${(process.env.NEXTAUTH_URL ?? '').trim()}/reset-password?token=${resetToken.token}`

    await sendPasswordResetEmail({ toEmail: user.email, name: user.name, resetUrl }).catch((err) =>
      console.error('Failed to send password reset email:', err)
    )

    return NextResponse.json({ message: 'If an account exists, a reset link has been sent' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
