// Generates per-site favicons, touch icons, and social preview images.
// Run: node scripts/gen-assets.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const art = 'src/shared/assets/art';
const icons = 'src/shared/assets/icons';

async function og(source, dest) {
  await sharp(source).resize(1200, 630, { fit: 'cover' }).png({ quality: 85 }).toFile(dest);
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
  await sharp(`${dir}/favicon.svg`, { density: 300 })
    .resize(180, 180)
    .png()
    .toFile(`${dir}/apple-touch-icon.png`);
  await og(`${art}/company-hero.png`, `${dir}/og.png`);
}

await companySite();
await appSite('bronzed');
await appSite('stellar');
console.log('static assets generated');
