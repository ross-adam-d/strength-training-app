import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/coach/messages?clientId=xxx (coach) or no param (client)
// Returns messages for the relationship + marks incoming messages as read
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const isCoach = session.user.role === 'COACH'

    // Resolve the relationship
    let relationship
    if (isCoach) {
      if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })
      relationship = await prisma.coachClientRelationship.findUnique({
        where: { coachId_clientId: { coachId: session.user.id, clientId } },
      })
    } else {
      relationship = await prisma.coachClientRelationship.findFirst({
        where: { clientId: session.user.id, status: 'ACTIVE' },
      })
    }

    if (!relationship) return NextResponse.json({ messages: [], unreadCount: 0 })

    // Mark incoming messages as read
    const incomingSenderRole = isCoach ? 'CLIENT' : 'COACH'
    await prisma.coachMessage.updateMany({
      where: {
        relationshipId: relationship.id,
        senderRole: incomingSenderRole,
        readAt: null,
      },
      data: { readAt: new Date() },
    })

    const messages = await prisma.coachMessage.findMany({
      where: { relationshipId: relationship.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        senderRole: true,
        senderId: true,
        content: true,
        readAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ messages, relationshipId: relationship.id })
  } catch (error) {
    console.error('GET /api/coach/messages error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST /api/coach/messages
// Body: { content, clientId? }
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content, clientId } = await request.json()
    if (!content?.trim()) return NextResponse.json({ error: 'Message content required' }, { status: 400 })

    const isCoach = session.user.role === 'COACH'

    let relationship
    if (isCoach) {
      if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })
      relationship = await prisma.coachClientRelationship.findUnique({
        where: { coachId_clientId: { coachId: session.user.id, clientId } },
      })
    } else {
      relationship = await prisma.coachClientRelationship.findFirst({
        where: { clientId: session.user.id, status: 'ACTIVE' },
      })
    }

    if (!relationship) return NextResponse.json({ error: 'No active coaching relationship' }, { status: 404 })
    if (relationship.status !== 'ACTIVE') return NextResponse.json({ error: 'Relationship is not active' }, { status: 403 })

    const message = await prisma.coachMessage.create({
      data: {
        relationshipId: relationship.id,
        senderRole: isCoach ? 'COACH' : 'CLIENT',
        senderId: session.user.id,
        content: content.trim(),
      },
      select: {
        id: true,
        senderRole: true,
        senderId: true,
        content: true,
        readAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('POST /api/coach/messages error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
