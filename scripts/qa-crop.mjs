// Crop a region from a QA screenshot for close inspection.
// Run: node scripts/qa-crop.mjs <in> <out> <left> <top> <width> <height>
import sharp from 'sharp';

const [, , input, output, left, top, width, height] = process.argv;
await sharp(input)
  .extract({ left: +left, top: +top, width: +width, height: +height })
  .toFile(output);
console.log(output);
