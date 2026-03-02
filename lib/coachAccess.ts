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

/**
 * Verify that coachId created this macrocycle and has an active client relationship
 * with the macrocycle's owner.
 */
export async function verifyCoachBlockAccess(coachId: string, macrocycleId: string): Promise<boolean> {
  const macro = await prisma.macrocycle.findFirst({
    where: { id: macrocycleId, createdByCoachId: coachId },
    select: { userId: true },
  })
  if (!macro) return false
  return verifyCoachClientAccess(coachId, macro.userId)
}

/**
 * Verify that coachId created the macrocycle that contains this mesocycle,
 * and has an active client relationship with the macrocycle's owner.
 */
export async function verifyCoachMesocycleAccess(coachId: string, mesocycleId: string): Promise<boolean> {
  const meso = await prisma.mesocycle.findFirst({
    where: { id: mesocycleId },
    select: { macrocycle: { select: { id: true, createdByCoachId: true, userId: true } } },
  })
  if (!meso?.macrocycle?.createdByCoachId || meso.macrocycle.createdByCoachId !== coachId) return false
  return verifyCoachClientAccess(coachId, meso.macrocycle.userId)
}
