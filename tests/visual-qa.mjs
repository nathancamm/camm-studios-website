import { strict as assert } from 'node:assert';
import { mkdir } from 'node:fs/promises';
import { chromium, firefox, webkit } from '@playwright/test';

const sites = [
  { name: 'company', url: 'http://127.0.0.1:4321' },
  { name: 'bronzed', url: 'http://127.0.0.1:4322' },
  { name: 'stellar', url: 'http://127.0.0.1:4323' },
];
const widths = [390, 430, 768, 1440, 1728];
const output = new URL('../output/playwright/', import.meta.url).pathname;

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });

try {
  for (const site of sites) {
    for (const width of widths) {
      const height = width < 800 ? 900 : 1000;
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
      await context.addInitScript(() => sessionStorage.setItem('camm-intro-seen', '1'));
      const page = await context.newPage();
      await page.goto(site.url, { waitUntil: 'networkidle' });
      await page.locator('[data-reveal]').evaluateAll((elements) => elements.forEach((element) => element.classList.add('is-visible')));
      await page.waitForTimeout(850);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 1, `${site.name} overflows by ${overflow}px at ${width}px`);

      await page.locator('img').evaluateAll((images) => images.forEach((image) => { image.loading = 'eager'; }));
      await page.waitForFunction(() => [...document.images].every((image) => image.complete));
      const brokenImages = await page.locator('img').evaluateAll((images) => images.filter((image) => image.naturalWidth === 0).map((image) => image.src));
      assert.deepEqual(brokenImages, [], `${site.name} has broken images at ${width}px`);

      if (width === 390) {
        await page.locator('.menu-toggle').click();
        assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
        await page.locator('.menu-toggle').click();
      }

      await page.screenshot({ path: `${output}${site.name}-${width}.png`, fullPage: width === 390 || width === 1440 });
      await context.close();
    }
  }

  const introContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const introPage = await introContext.newPage();
  await introPage.goto(sites[0].url, { waitUntil: 'networkidle' });
  assert.equal(await introPage.locator('[data-company-intro]').count(), 1, 'Company introduction did not start on a fresh session');
  await introPage.waitForTimeout(3000);
  assert.equal(await introPage.locator('[data-company-intro]').count(), 0, 'Company introduction did not finish');
  await introPage.reload({ waitUntil: 'networkidle' });
  assert.equal(await introPage.locator('[data-company-intro]').count(), 0, 'Company introduction repeated in one session');
  await introContext.close();

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(sites[0].url, { waitUntil: 'networkidle' });
  assert.equal(await reducedPage.locator('[data-company-intro]').count(), 0, 'Reduced motion did not skip the introduction');
  const hiddenReveals = await reducedPage.locator('[data-reveal]').evaluateAll((elements) => elements.filter((element) => Number.parseFloat(getComputedStyle(element).opacity) < 1).length);
  assert.equal(hiddenReveals, 0, 'Reduced motion left hidden content');
  await reducedContext.close();

  for (const site of sites) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await context.addInitScript(() => sessionStorage.setItem('camm-intro-seen', '1'));
    const routes = site.name === 'company'
      ? ['/', '/support/', '/privacy/', '/terms/']
      : ['/', '/blog/', '/support/', '/privacy/', '/terms/', '/rss.xml', '/sitemap.xml'];
    for (const route of routes) {
      const response = await page.goto(`${site.url}${route}`, { waitUntil: 'domcontentloaded' });
      assert.equal(response?.status(), 200, `${site.name}${route} returned ${response?.status()}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

console.log('Visual QA passed at 390, 430, 768, 1440, and 1728 pixels.');

for (const engine of [
  { name: 'firefox', type: firefox },
  { name: 'webkit', type: webkit },
]) {
  const engineBrowser = await engine.type.launch({ headless: true });
  try {
    for (const site of sites) {
      for (const width of [390, 1440]) {
        const context = await engineBrowser.newContext({
          viewport: { width, height: width === 390 ? 900 : 1000 },
          isMobile: engine.name === 'webkit' && width === 390,
          hasTouch: engine.name === 'webkit' && width === 390,
        });
        await context.addInitScript(() => sessionStorage.setItem('camm-intro-seen', '1'));
        const page = await context.newPage();
        const response = await page.goto(site.url, { waitUntil: 'networkidle' });
        assert.equal(response?.status(), 200, `${site.name} failed in ${engine.name}`);
        await page.locator('[data-reveal]').evaluateAll((elements) => elements.forEach((element) => element.classList.add('is-visible')));
        await page.locator('img').evaluateAll((images) => images.forEach((image) => { image.loading = 'eager'; }));
        await page.waitForFunction(() => [...document.images].every((image) => image.complete));
        await page.waitForTimeout(850);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(overflow <= 1, `${site.name} overflows by ${overflow}px in ${engine.name} at ${width}px`);
        const brokenImages = await page.locator('img').evaluateAll((images) => images.filter((image) => image.naturalWidth === 0).map((image) => image.src));
        assert.deepEqual(brokenImages, [], `${site.name} has broken images in ${engine.name} at ${width}px`);
        await page.screenshot({ path: `${output}${site.name}-${engine.name}-${width}.png`, fullPage: width === 390 });
        await context.close();
      }
    }
  } finally {
    await engineBrowser.close();
  }
}

console.log('Firefox and WebKit QA passed at desktop and mobile widths.');
