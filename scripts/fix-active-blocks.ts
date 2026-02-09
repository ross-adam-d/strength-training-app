import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixActiveBlocks() {
  try {
    // Find all users with multiple active blocks
    const activeBlocks = await prisma.macrocycle.findMany({
      where: { status: 'active' },
      orderBy: { startDate: 'desc' },
    })

    console.log(`Found ${activeBlocks.length} active blocks total`)

    // Group by userId
    const byUser = new Map<string, typeof activeBlocks>()
    for (const block of activeBlocks) {
      if (!byUser.has(block.userId)) {
        byUser.set(block.userId, [])
      }
      byUser.get(block.userId)!.push(block)
    }

    console.log(`Across ${byUser.size} users`)

    // Fix users with multiple active blocks
    let fixed = 0
    for (const [userId, blocks] of byUser.entries()) {
      if (blocks.length > 1) {
        console.log(`\nUser ${userId} has ${blocks.length} active blocks:`)
        blocks.forEach((b, i) => {
          console.log(`  ${i + 1}. ${b.name} (${b.id}) - Start: ${b.startDate}`)
        })

        // Keep the most recent (first in array due to desc sort), set others to planned
        const [keep, ...rest] = blocks
        console.log(`  Keeping: ${keep.name}`)
        console.log(`  Setting to 'planned': ${rest.map(b => b.name).join(', ')}`)

        for (const block of rest) {
          await prisma.macrocycle.update({
            where: { id: block.id },
            data: { status: 'planned' },
          })
          fixed++
        }
      }
    }

    console.log(`\n✅ Fixed ${fixed} blocks`)

    // Verify
    const remainingActive = await prisma.macrocycle.groupBy({
      by: ['userId'],
      where: { status: 'active' },
      _count: true,
    })

    const violations = remainingActive.filter(r => r._count > 1)
    if (violations.length > 0) {
      console.log(`\n⚠️  Still have ${violations.length} users with multiple active blocks!`)
    } else {
      console.log(`\n✅ All users now have at most 1 active block`)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixActiveBlocks()
