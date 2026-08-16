// Generates per-site favicons, touch icons, and social preview images.
// Run: node scripts/gen-assets.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const art = 'src/shared/assets/art';
const icons = 'src/shared/assets/icons';
const brand = 'src/shared/assets/brand';

async function og(source, dest) {
  await sharp(source).resize(1200, 630, { fit: 'cover' }).png({ quality: 85 }).toFile(dest);
}

/** dark rounded square with the paper logo glyph centered */
async function brandIcon(size, dest) {
  const glyphSize = Math.round(size * 0.62);
  const glyph = await sharp(`${brand}/logo-paper.png`)
    .resize(glyphSize, glyphSize, { fit: 'inside' })
    .png()
    .toBuffer();
  const radius = Math.round(size * 0.22);
  const plate = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#181818"/></svg>`,
  );
  await sharp(plate).composite([{ input: glyph, gravity: 'center' }]).png().toFile(dest);
}

async function appSite(name) {
  const dir = `public/${name}`;
  await mkdir(dir, { recursive: true });
  const icon = `${icons}/${name}-icon.png`;
  await sharp(icon).resize(48, 48).png().toFile(`${dir}/favicon.png`);
  await sharp(icon).resize(64, 64).png().toFile(`${dir}/favicon-64.png`);
  await sharp(icon).resize(180, 180).png().toFile(`${dir}/apple-touch-icon.png`);
  await og(`${art}/${name}-hero.png`, `${dir}/og.png`);
}

async function companySite() {
  const dir = 'public/company';
  await mkdir(dir, { recursive: true });
  await brandIcon(48, `${dir}/favicon.png`);
  await brandIcon(64, `${dir}/favicon-64.png`);
  await brandIcon(180, `${dir}/apple-touch-icon.png`);
  await og(`${art}/company-hero.png`, `${dir}/og.png`);
}

await companySite();
await appSite('bronzed');
await appSite('stellar');
console.log('static assets generated');
