/**
 * Backfills stripeCustomerId for subscriptions that have a stripeSubscriptionId
 * but no stripeCustomerId (e.g. users who subscribed before the customer ID was saved).
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-stripe-customer.ts
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-stripe-customer.ts --run
 */

import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const DRY_RUN = !process.argv.includes('--run')
const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-01-28.clover' })

async function main() {
  console.log(DRY_RUN ? '[DRY RUN] No changes will be made.' : '[LIVE] Writing to database.')

  const subs = await prisma.subscription.findMany({
    where: {
      stripeSubscriptionId: { not: null },
      stripeCustomerId: null,
    },
    select: {
      userId: true,
      stripeSubscriptionId: true,
      user: { select: { email: true } },
    },
  })

  if (subs.length === 0) {
    console.log('No subscriptions need backfilling.')
    return
  }

  console.log(`Found ${subs.length} subscription(s) missing stripeCustomerId:\n`)

  for (const sub of subs) {
    const subId = sub.stripeSubscriptionId!
    try {
      const stripeSub = await stripe.subscriptions.retrieve(subId)
      const customerId = typeof stripeSub.customer === 'string'
        ? stripeSub.customer
        : stripeSub.customer.id

      console.log(`  ${sub.user.email} | subId=${subId} | customerId=${customerId}`)

      if (!DRY_RUN) {
        await prisma.subscription.update({
          where: { userId: sub.userId },
          data: { stripeCustomerId: customerId },
        })
        console.log(`    → Updated.`)
      }
    } catch (err: any) {
      console.error(`  ERROR for ${sub.user.email} (${subId}): ${err.message}`)
    }
  }

  console.log(DRY_RUN ? '\nDry run complete. Rerun with --run to apply.' : '\nDone.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
