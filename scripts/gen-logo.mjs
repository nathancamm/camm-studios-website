// Builds transparent ink/paper versions of the original Camm Studios logo
// by mapping source luminance to alpha. Run: node scripts/gen-logo.mjs
import sharp from 'sharp';

const SRC = 'src/shared/assets/brand/logo-original.png';

async function tinted(rgb, dest) {
  const { data, info } = await sharp(SRC)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const lum = data[i];
    // dark source pixel -> opaque glyph pixel
    const alpha = 255 - lum;
    out[i * 4] = rgb[0];
    out[i * 4 + 1] = rgb[1];
    out[i * 4 + 2] = rgb[2];
    out[i * 4 + 3] = alpha;
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(dest);
  console.log(dest);
}

await tinted([20, 20, 20], 'src/shared/assets/brand/logo-ink.png');
await tinted([242, 242, 242], 'src/shared/assets/brand/logo-paper.png');
