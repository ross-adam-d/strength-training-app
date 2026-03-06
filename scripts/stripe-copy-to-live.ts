/**
 * stripe-copy-to-live.ts
 *
 * Reads your test-mode products + prices and recreates them in live mode.
 *
 * Usage:
 *   STRIPE_LIVE_SECRET_KEY=sk_live_xxx npx ts-node --project tsconfig.scripts.json scripts/stripe-copy-to-live.ts
 *
 * What it does:
 *   1. Fetches the two test products (CORE, ELITE) and their prices
 *   2. Creates equivalent products in live mode
 *   3. Creates equivalent prices in live mode
 *   4. Prints the new live price IDs and the env var block to copy into Vercel
 *
 * Safe to run multiple times — it will skip creation if a product with the
 * same metadata.test_product_id already exists in live mode.
 */

import Stripe from 'stripe'

const TEST_SECRET_KEY  = process.env.STRIPE_SECRET_KEY!
const LIVE_SECRET_KEY  = process.env.STRIPE_LIVE_SECRET_KEY!

if (!TEST_SECRET_KEY || !TEST_SECRET_KEY.startsWith('sk_test_')) {
  console.error('❌  STRIPE_SECRET_KEY must be set and must be a test key (sk_test_...)')
  process.exit(1)
}
if (!LIVE_SECRET_KEY || !LIVE_SECRET_KEY.startsWith('sk_live_')) {
  console.error('❌  STRIPE_LIVE_SECRET_KEY must be set and must be a live key (sk_live_...)')
  process.exit(1)
}

const TEST_PRODUCT_IDS = ['prod_U2NH3sMFv9sdOn', 'prod_U2NTjm8x7TMHTt']

const test = new Stripe(TEST_SECRET_KEY, { apiVersion: '2026-01-28.clover' })
const live = new Stripe(LIVE_SECRET_KEY,  { apiVersion: '2026-01-28.clover' })

async function getOrCreateLiveProduct(testProduct: Stripe.Product): Promise<string> {
  // Check if already copied (idempotent)
  const existing = await live.products.search({
    query: `metadata['test_product_id']:'${testProduct.id}'`,
  })
  if (existing.data.length > 0) {
    console.log(`  ↩  Product already exists in live: ${existing.data[0].id} (${testProduct.name})`)
    return existing.data[0].id
  }

  const created = await live.products.create({
    name: testProduct.name,
    description: testProduct.description ?? undefined,
    metadata: {
      ...testProduct.metadata,
      test_product_id: testProduct.id,
    },
  })
  console.log(`  ✓  Created live product: ${created.id} (${created.name})`)
  return created.id
}

async function getOrCreateLivePrice(
  testPrice: Stripe.Price,
  liveProductId: string
): Promise<{ key: string; liveId: string }> {
  const currency = testPrice.currency.toUpperCase()
  const interval = testPrice.recurring?.interval ?? 'month'
  const key = `${interval === 'year' ? 'ANNUAL' : 'MONTHLY'}_${currency}`

  // Check if already copied
  const existing = await live.prices.search({
    query: `metadata['test_price_id']:'${testPrice.id}'`,
  })
  if (existing.data.length > 0) {
    console.log(`    ↩  Price already exists in live: ${existing.data[0].id} (${currency} ${interval})`)
    return { key, liveId: existing.data[0].id }
  }

  const created = await live.prices.create({
    product: liveProductId,
    currency: testPrice.currency,
    unit_amount: testPrice.unit_amount!,
    recurring: testPrice.recurring
      ? { interval: testPrice.recurring.interval, interval_count: testPrice.recurring.interval_count }
      : undefined,
    nickname: testPrice.nickname ?? undefined,
    metadata: {
      ...testPrice.metadata,
      test_price_id: testPrice.id,
    },
  })
  console.log(`    ✓  Created live price: ${created.id} (${currency} ${interval} — ${(testPrice.unit_amount! / 100).toFixed(2)})`)
  return { key, liveId: created.id }
}

async function main() {
  console.log('\n🔄  Fetching test products...\n')

  const results: Record<string, Record<string, string>> = {}

  for (const testProductId of TEST_PRODUCT_IDS) {
    const testProduct = await test.products.retrieve(testProductId)
    console.log(`\n📦  Product: ${testProduct.name} (${testProduct.id})`)

    // Fetch all active prices for this test product
    const testPrices = await test.prices.list({
      product: testProductId,
      active: true,
      limit: 20,
    })
    console.log(`    ${testPrices.data.length} prices found`)

    // Create/find live product
    const liveProductId = await getOrCreateLiveProduct(testProduct)
    results[testProduct.name] = { liveProductId }

    // Create/find live prices
    for (const testPrice of testPrices.data) {
      const { key, liveId } = await getOrCreateLivePrice(testPrice, liveProductId)
      results[testProduct.name][key] = liveId
    }
  }

  // Print summary
  console.log('\n\n✅  Done! Here are your live IDs:\n')
  console.log('='.repeat(60))

  for (const [productName, data] of Object.entries(results)) {
    const tier = productName.toLowerCase().includes('elite') ? 'ELITE' : 'CORE'
    console.log(`\n${productName}  (live product: ${data.liveProductId})`)
    for (const [key, id] of Object.entries(data)) {
      if (key === 'liveProductId') continue
      console.log(`  STRIPE_PRICE_${tier}_${key}="${id}"`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n📋  Env var block — paste into Vercel + .env.local:\n')

  for (const [productName, data] of Object.entries(results)) {
    const tier = productName.toLowerCase().includes('elite') ? 'ELITE' : 'CORE'
    for (const [key, id] of Object.entries(data)) {
      if (key === 'liveProductId') continue
      console.log(`STRIPE_PRICE_${tier}_${key}="${id}"`)
    }
  }

  console.log('\n')
  console.log('Also update lib/stripe.ts STRIPE_PRODUCTS with the live product IDs above.')
  console.log('And set STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your live keys in Vercel.\n')
}

main().catch((err) => {
  console.error('\n❌  Error:', err.message)
  process.exit(1)
})
