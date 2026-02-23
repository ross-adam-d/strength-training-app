import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// App icon: dark background with "ST" initials in sky blue
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#1a1a1a"/>
  <text x="256" y="330" text-anchor="middle" font-family="Arial, sans-serif" font-size="260" font-weight="700" fill="#0ea5e9">ST</text>
</svg>`;

const svgBuffer = Buffer.from(svg);

const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(path.join(process.cwd(), 'public'))) {
  fs.mkdirSync(path.join(process.cwd(), 'public'));
}
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

const sizes = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512];

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
  console.log(`Generated ${size}x${size}`);
}

console.log('Done.');
