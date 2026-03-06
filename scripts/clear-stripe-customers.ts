import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const DRY_RUN = process.argv[2] !== '--run'
  const subs = await prisma.subscription.findMany({
    where: { stripeCustomerId: { not: null } },
    select: { userId: true, stripeCustomerId: true },
  })
  console.log(`\nFound ${subs.length} subscriptions with a stripeCustomerId`)
  subs.forEach(s => console.log(' ', s.userId, s.stripeCustomerId))
  if (DRY_RUN) {
    console.log('\n⚠️  Dry run — pass --run to clear them')
    return
  }
  const result = await prisma.subscription.updateMany({
    where: { stripeCustomerId: { not: null } },
    data: { stripeCustomerId: null },
  })
  console.log(`\n✅  Cleared stripeCustomerId for ${result.count} users`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
