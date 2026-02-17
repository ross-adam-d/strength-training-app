import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const patchSchema = z.object({
  manualAccessGrantedUntil: z.string().datetime().nullable().optional(),
  status: z.enum(['TRIALING', 'ACTIVE', 'PAST_DUE', 'READ_ONLY', 'CANCELLED']).optional(),
  trialEndsAt: z.string().datetime().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.errors }, { status: 400 })
  }

  const { manualAccessGrantedUntil, status, trialEndsAt } = parsed.data

  const updateData: Record<string, unknown> = {}
  if (manualAccessGrantedUntil !== undefined) {
    updateData.manualAccessGrantedUntil = manualAccessGrantedUntil ? new Date(manualAccessGrantedUntil) : null
  }
  if (status !== undefined) {
    updateData.status = status
    if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date()
    }
  }
  if (trialEndsAt !== undefined) {
    updateData.trialEndsAt = new Date(trialEndsAt)
  }

  const subscription = await prisma.subscription.update({
    where: { userId: id },
    data: updateData,
  })

  return NextResponse.json(subscription)
}
