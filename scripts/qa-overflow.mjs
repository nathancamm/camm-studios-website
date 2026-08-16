// Re-check a single page for horizontal overflow at a width.
// Run: node scripts/qa-overflow.mjs <url> <width>
import { chromium } from 'playwright';

const url = process.argv[2];
const width = Number(process.argv[3] ?? 768);
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
console.log(`overflow @${width}: ${overflow}px`);
await b.close();
