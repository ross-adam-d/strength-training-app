import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password } = schema.parse(body)

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, emailVerified: true } } },
    })

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 })
    }

    if (resetToken.usedAt) {
      return NextResponse.json({ error: 'This reset link has already been used. Please request a new one.' }, { status: 400 })
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 })
    }

    const hashedPassword = await hash(password, 12)

    const now = new Date()

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          // If email wasn't verified yet, completing a password reset proves ownership
          emailVerified: resetToken.user.emailVerified ?? now,
        },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { usedAt: now },
      }),
    ])

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? 'Invalid input' }, { status: 400 })
    }
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
