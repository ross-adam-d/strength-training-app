#!/usr/bin/env node
// Generates branded placeholder screenshots for the PWA manifest.
// Run with: node scripts/generate-screenshots.js
// Replace public/screenshots/*.png with real app screenshots when ready.

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const outDir = path.join(__dirname, '../public/screenshots')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

// pbX mark paths (48×48 viewBox), rendered via SVG transform
const markPaths = `
  <path d="M 44.68 27.65 A 21 21 0 0 1 16.82 43.73 L 16.50 37.00 L 20.50 30.06 A 7 7 0 0 0 30.89 25.22 Z" fill="#FF8000"/>
  <path d="M 10.50 40.09 A 21 21 0 0 1 10.50 7.91 L 16.50 11.01 L 20.50 17.94 A 7 7 0 0 0 19.50 29.36 Z" fill="#FF8000"/>
  <path d="M 16.82 4.27 A 21 21 0 0 1 44.68 20.36 L 39.00 24.00 L 31.00 24.00 A 7 7 0 0 0 21.61 17.42 Z" fill="#FF8000"/>
`

function mobileSvg(w, h) {
  const markSize = 160
  const scale = markSize / 48
  const markX = (w - markSize) / 2
  const markY = 140
  const cx = w / 2

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="#111827"/>
  <g transform="translate(${markX}, ${markY}) scale(${scale})">
    ${markPaths}
  </g>
  <text x="${cx}" y="${markY + markSize + 48}" text-anchor="middle"
    font-family="system-ui,-apple-system,sans-serif" font-size="52" font-weight="900" fill="#FF8000">pbX</text>
  <text x="${cx}" y="${markY + markSize + 82}" text-anchor="middle"
    font-family="system-ui,-apple-system,sans-serif" font-size="13" letter-spacing="3" fill="rgba(255,255,255,0.45)">PLAN · BUILD · EXECUTE</text>
  <rect x="${cx - 100}" y="${markY + markSize + 108}" width="200" height="1" fill="rgba(255,255,255,0.08)"/>
  <text x="${cx}" y="${markY + markSize + 148}" text-anchor="middle"
    font-family="system-ui,-apple-system,sans-serif" font-size="15" fill="rgba(255,255,255,0.35)">Structured strength training</text>
  <text x="${cx}" y="${markY + markSize + 172}" text-anchor="middle"
    font-family="system-ui,-apple-system,sans-serif" font-size="15" fill="rgba(255,255,255,0.35)">for serious athletes</text>
</svg>`
}

function desktopSvg(w, h) {
  const markSize = 120
  const scale = markSize / 48
  const markX = (w - markSize) / 2
  const markY = (h - markSize) / 2 - 80
  const cx = w / 2

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="#111827"/>
  <g transform="translate(${markX}, ${markY}) scale(${scale})">
    ${markPaths}
  </g>
  <text x="${cx}" y="${markY + markSize + 44}" text-anchor="middle"
    font-family="system-ui,-apple-system,sans-serif" font-size="52" font-weight="900" fill="#FF8000">pbX</text>
  <text x="${cx}" y="${markY + markSize + 76}" text-anchor="middle"
    font-family="system-ui,-apple-system,sans-serif" font-size="13" letter-spacing="3" fill="rgba(255,255,255,0.45)">PLAN · BUILD · EXECUTE</text>
</svg>`
}

async function main() {
  // Mobile screenshot (portrait)
  await sharp(Buffer.from(mobileSvg(390, 844)))
    .png()
    .toFile(path.join(outDir, 'mobile.png'))
  console.log('✓ mobile.png  (390×844)')

  // Desktop / wide screenshot (landscape)
  await sharp(Buffer.from(desktopSvg(1280, 720)))
    .png()
    .toFile(path.join(outDir, 'desktop.png'))
  console.log('✓ desktop.png (1280×720)')

  console.log('Done. Replace with real app screenshots when ready.')
}

main().catch((err) => { console.error(err); process.exit(1) })
