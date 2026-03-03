import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/coach/messages/unread
// Returns unread message counts.
// Coach: { clients: { clientId, count }[] } — per-client unread (CLIENT-sent, unread by coach)
// Client: { count: number } — total unread from coach
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (session.user.role === 'COACH') {
      // Find all active relationships for this coach
      const relationships = await prisma.coachClientRelationship.findMany({
        where: { coachId: session.user.id, status: 'ACTIVE' },
        select: { id: true, clientId: true },
      })

      const counts = await Promise.all(
        relationships.map(async (rel) => {
          const count = await prisma.coachMessage.count({
            where: { relationshipId: rel.id, senderRole: 'CLIENT', readAt: null },
          })
          return { clientId: rel.clientId, count }
        })
      )

      return NextResponse.json({ clients: counts.filter((c) => c.count > 0) })
    } else {
      const relationship = await prisma.coachClientRelationship.findFirst({
        where: { clientId: session.user.id, status: 'ACTIVE' },
        select: { id: true },
      })

      if (!relationship) return NextResponse.json({ count: 0 })

      const count = await prisma.coachMessage.count({
        where: { relationshipId: relationship.id, senderRole: 'COACH', readAt: null },
      })

      return NextResponse.json({ count })
    }
  } catch (error) {
    console.error('GET /api/coach/messages/unread error:', error)
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 })
  }
}
