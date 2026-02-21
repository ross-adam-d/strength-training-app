import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CURRENT_RELEASE_ID } from '@/lib/releaseNotes'

export async function PATCH() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastSeenReleaseId: CURRENT_RELEASE_ID },
  })

  return NextResponse.json({ ok: true })
}
