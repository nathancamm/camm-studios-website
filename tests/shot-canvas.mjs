// Screenshot one hero canvas for design iteration.
// Usage: node tests/shot-canvas.mjs <url> <outfile> [waitMs]
import { chromium } from '@playwright/test';

const [url, outfile, waitMs = '3000'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(Number(waitMs));
await page.locator('.three-scene').first().screenshot({ path: outfile });
await browser.close();
console.log(`saved ${outfile}`);
