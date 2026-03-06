import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, subscription: { select: { status: true, trialEndsAt: true } } },
    orderBy: { createdAt: 'asc' },
  })
  users.forEach(u => console.log(u.email, '|', u.subscription?.status, '|', u.subscription?.trialEndsAt))
}
main().catch(console.error).finally(() => prisma.$disconnect())
