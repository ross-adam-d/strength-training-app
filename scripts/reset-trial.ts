import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const DRY_RUN = process.argv[2] !== '--run'
const EMAIL = process.argv[3] || 'Rosscorossoross@gmail.com'

async function main() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const user = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: { id: true, email: true, subscription: { select: { trialEndsAt: true, status: true } } },
  })

  if (!user) {
    console.log(`❌  User not found: ${EMAIL}`)
    return
  }

  console.log(`\nUser: ${user.email}`)
  console.log(`Current trialEndsAt: ${user.subscription?.trialEndsAt}`)
  console.log(`Current status:      ${user.subscription?.status}`)
  console.log(`Will set trialEndsAt → ${yesterday.toISOString()}`)

  if (DRY_RUN) {
    console.log('\n⚠️  Dry run — pass --run to apply')
    return
  }

  await prisma.subscription.update({
    where: { userId: user.id },
    data: { trialEndsAt: yesterday, status: 'TRIALING' },
  })

  console.log('\n✅  Done — status set to TRIALING, trial expired yesterday. Subscription prompt should now appear.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
