// Mobile nav interaction check: open the hamburger, confirm the overlay shows,
// press Escape, confirm it hides. Also confirms the intro plays once per session.
import { chromium } from 'playwright';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto('http://localhost:4322/index.html', { waitUntil: 'networkidle' });

await page.click('[data-nav-toggle]');
await page.waitForTimeout(800);
const openState = await page.evaluate(() => ({
  navOpen: document.documentElement.classList.contains('nav-open'),
  overlayVisible: getComputedStyle(document.querySelector('[data-nav-overlay]')).visibility,
}));
await page.keyboard.press('Escape');
await page.waitForTimeout(800);
const closedState = await page.evaluate(() =>
  document.documentElement.classList.contains('nav-open'),
);

// intro on company home: plays on first visit, skipped on second
const cPage = await ctx.newPage();
await cPage.goto('http://localhost:4321/index.html', { waitUntil: 'networkidle' });
const firstVisit = await cPage.evaluate(() => document.documentElement.className);
await cPage.reload({ waitUntil: 'networkidle' });
const secondVisit = await cPage.evaluate(() => document.documentElement.className);

console.log(JSON.stringify({ openState, closedAfterEscape: !closedState, firstVisit, secondVisit }, null, 1));
await b.close();
