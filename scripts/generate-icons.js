#!/usr/bin/env node
// Generates all PWA icon sizes from public/icons/icon.svg using sharp.
// Run with: node scripts/generate-icons.js

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const svgPath = path.join(__dirname, '../public/icons/icon.svg')
const outDir = path.join(__dirname, '../public/icons')

const sizes = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512]

async function main() {
  const svgBuffer = fs.readFileSync(svgPath)
  for (const size of sizes) {
    const outFile = path.join(outDir, `icon-${size}x${size}.png`)
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outFile)
    console.log(`✓ ${size}x${size}`)
  }
  console.log('All icons generated.')
}

main().catch((err) => { console.error(err); process.exit(1) })
