import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      referralCode: true,
      referredUsers: {
        where: { emailVerified: { not: null } },
        select: { id: true },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Backfill: generate a referral code for existing users who don't have one
  if (!user.referralCode) {
    const code = randomBytes(4).toString('hex').toUpperCase()
    user = await prisma.user.update({
      where: { id: session.user.id },
      data: { referralCode: code },
      select: {
        referralCode: true,
        referredUsers: {
          where: { emailVerified: { not: null } },
          select: { id: true },
        },
      },
    })
  }

  const baseUrl = (process.env.NEXTAUTH_URL ?? '').trim()

  return NextResponse.json({
    referralCode: user.referralCode,
    referralLink: `${baseUrl}/register?ref=${user.referralCode}`,
    referralCount: user.referredUsers.length,
  })
}
