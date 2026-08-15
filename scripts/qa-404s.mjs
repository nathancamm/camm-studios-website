// Lists resources that return 404 on a page. Run: node scripts/qa-404s.mjs <url>
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:4322/index.html';
const b = await chromium.launch();
const page = await b.newPage();
const fails = [];
page.on('response', (r) => {
  if (r.status() === 404) fails.push(r.url());
});
await page.goto(url, { waitUntil: 'networkidle' });
console.log(fails.join('\n') || 'none');
await b.close();
