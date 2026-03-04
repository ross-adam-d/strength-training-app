import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const DRY_RUN = process.argv[2] !== '--run'

async function grandfatherEmailVerified() {
  try {
    const unverified = await prisma.user.findMany({
      where: { emailVerified: null },
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    console.log(`\nUsers with emailVerified = NULL: ${unverified.length}`)

    if (unverified.length === 0) {
      console.log('Nothing to do.')
      return
    }

    for (const user of unverified) {
      console.log(`  ${user.email} (${user.name ?? 'no name'}) — joined ${user.createdAt.toISOString().slice(0, 10)}`)
    }

    if (DRY_RUN) {
      console.log('\n⚠️  DRY RUN — no changes made.')
      console.log('Run with --run to apply: npx tsx scripts/grandfather-email-verified.ts --run')
      return
    }

    const result = await prisma.user.updateMany({
      where: { emailVerified: null },
      data: { emailVerified: new Date() },
    })

    console.log(`\n✅ Updated ${result.count} users — emailVerified set to now.`)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

grandfatherEmailVerified()
