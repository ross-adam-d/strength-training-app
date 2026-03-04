import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/verify-email?status=invalid', request.url))
  }

  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
  })

  if (
    !verificationToken ||
    verificationToken.usedAt !== null ||
    verificationToken.expiresAt < new Date()
  ) {
    return NextResponse.redirect(new URL('/verify-email?status=invalid', request.url))
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    }),
  ])

  return NextResponse.redirect(new URL('/verify-email?status=success', request.url))
}
