import { prisma } from './prisma'

/**
 * Verify that coachId has an ACTIVE coaching relationship with clientId.
 * Returns true if access is granted, false otherwise.
 */
export async function verifyCoachClientAccess(coachId: string, clientId: string): Promise<boolean> {
  const rel = await prisma.coachClientRelationship.findUnique({
    where: { coachId_clientId: { coachId, clientId } },
    select: { status: true },
  })
  return rel?.status === 'ACTIVE'
}
