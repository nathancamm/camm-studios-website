// Visual QA: full-page screenshots of every key page at three widths.
// Run: node scripts/qa-shots.mjs [outDir]
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const out = process.argv[2] ?? 'qa-shots';
await mkdir(out, { recursive: true });

const sites = {
  company: { port: 4321, pages: ['index.html', 'support.html', 'privacy.html', '404.html'] },
  bronzed: { port: 4322, pages: ['index.html', 'blog.html', 'blog/uv-index-explained.html', 'support.html', 'terms.html', '404.html'] },
  stellar: { port: 4323, pages: ['index.html', 'blog/369-method-daily-ritual.html', 'support.html', '404.html'] },
};
const widths = [390, 768, 1440];

const browser = await chromium.launch();
const issues = [];
for (const [site, cfg] of Object.entries(sites)) {
  for (const width of widths) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));
    for (const path of cfg.pages) {
      const url = `http://localhost:${cfg.port}/${path}`;
      await page.goto(url, { waitUntil: 'networkidle' });
      // let reveals fire
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(600);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 1) issues.push(`${site} ${path} @${width}: horizontal overflow ${overflow}px`);
      const slug = path.replace(/[/.]/g, '_');
      await page.screenshot({ path: `${out}/${site}-${slug}-${width}.png`, fullPage: true });
    }
    if (errors.length) issues.push(`${site} @${width} console: ${errors.slice(0, 3).join(' | ')}`);
    await ctx.close();
  }
}
await browser.close();
console.log(issues.length ? issues.join('\n') : 'no overflow, no console errors');
