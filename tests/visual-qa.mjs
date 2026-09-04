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

async function assertAnimatedHeadingReadable(page, label) {
  const words = page.locator('[data-word-reveal] .word');
  if ((await words.count()) === 0) return;
  const unreadable = await words.evaluateAll((elements) =>
    elements
      .filter((element) => {
        const style = getComputedStyle(element);
        return (
          Number.parseFloat(style.opacity) < 0.99 ||
          style.color === 'rgba(0, 0, 0, 0)' ||
          style.webkitTextFillColor === 'rgba(0, 0, 0, 0)'
        );
      })
      .map((element) => element.textContent),
  );
  assert.deepEqual(
    unreadable,
    [],
    `${label} has transparent or incomplete animated heading words`,
  );
}

async function assertLightTheme(page, label) {
  const palette = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    return { background: body.backgroundColor, color: body.color };
  });
  const channels = (value) =>
    value
      .match(/[\d.]+/g)
      ?.slice(0, 3)
      .map(Number) ?? [];
  const background = channels(palette.background);
  const color = channels(palette.color);
  assert.ok(
    background.length === 3 && background.every((channel) => channel >= 240),
    `${label} does not have a cool white background: ${palette.background}`,
  );
  assert.ok(
    color.length === 3 && color.every((channel) => channel <= 40),
    `${label} does not use dark graphite text: ${palette.color}`,
  );
}

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });

try {
  for (const site of sites) {
    for (const width of widths) {
      const height = width < 800 ? 900 : 1000;
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      const runtimeErrors = [];
      page.on('pageerror', (error) => runtimeErrors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') runtimeErrors.push(message.text());
      });
      await page.goto(site.url, { waitUntil: 'networkidle' });
      await page
        .locator('[data-reveal]')
        .evaluateAll((elements) =>
          elements.forEach((element) => element.classList.add('is-visible')),
        );
      if (site.name === 'company' && width === 1440) {
        await page.locator('.three-scene.is-rendered').waitFor();
        await page.waitForTimeout(900);
        await page.screenshot({ path: `${output}company-arrival.png` });
        await page.waitForTimeout(1400);
        await page.screenshot({ path: `${output}company-folding.png` });
        await page.waitForTimeout(3300);
      } else {
        await page.waitForTimeout(site.name === 'company' ? 5600 : 1300);
      }

      assert.equal(
        await page.locator('canvas[data-three-scene]').count(),
        1,
        `${site.name} is missing its Three.js scene at ${width}px`,
      );
      await page.locator('[data-three-frame]').waitFor({ state: 'visible' });
      assert.ok(
        await page
          .locator('[data-three-frame]')
          .evaluate((element) => element.classList.contains('is-rendered')),
        `${site.name} WebGL scene did not render at ${width}px`,
      );
      assert.deepEqual(
        runtimeErrors,
        [],
        `${site.name} logged runtime errors at ${width}px`,
      );
      await assertAnimatedHeadingReadable(page, `${site.name} at ${width}px`);
      await assertLightTheme(page, `${site.name} at ${width}px`);

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      assert.ok(
        overflow <= 1,
        `${site.name} overflows by ${overflow}px at ${width}px`,
      );

      await page.locator('img').evaluateAll((images) =>
        images.forEach((image) => {
          image.loading = 'eager';
        }),
      );
      await page.waitForFunction(() =>
        [...document.images].every((image) => image.complete),
      );
      const brokenImages = await page
        .locator('img')
        .evaluateAll((images) =>
          images
            .filter((image) => image.naturalWidth === 0)
            .map((image) => image.src),
        );
      assert.deepEqual(
        brokenImages,
        [],
        `${site.name} has broken images at ${width}px`,
      );

      if (width === 390) {
        await page.locator('.menu-toggle').click();
        assert.equal(
          await page.locator('.menu-toggle').getAttribute('aria-expanded'),
          'true',
        );
        await page.waitForTimeout(750);
        assert.equal(
          await page
            .locator('.nav-panel')
            .evaluate((element) => getComputedStyle(element).opacity),
          '1',
        );
        assert.equal(
          await page
            .locator('.nav-panel')
            .evaluate((element) => getComputedStyle(element).pointerEvents),
          'auto',
        );
        await page.locator('.nav-panel a').last().focus();
        await page.keyboard.press('Tab');
        assert.ok(
          await page
            .locator('.menu-toggle')
            .evaluate((element) => element === document.activeElement),
          'Menu focus escaped the overlay',
        );
        await page.keyboard.press('Shift+Tab');
        assert.ok(
          await page
            .locator('.nav-panel a')
            .last()
            .evaluate((element) => element === document.activeElement),
          'Menu reverse focus escaped the overlay',
        );
        await page.keyboard.press('Escape');
        assert.ok(
          await page
            .locator('.menu-toggle')
            .evaluate((element) => element === document.activeElement),
          'Closing the menu lost keyboard focus',
        );
        await page.waitForTimeout(750);
      }

      if (width === 1440) {
        await page.getByRole('button', { name: 'Pause motion' }).click();
        assert.equal(
          await page.locator('.motion-toggle').getAttribute('aria-pressed'),
          'true',
        );
        const canvas = page.locator('canvas[data-three-scene]');
        const pausedFrame = await canvas.screenshot();
        await page.waitForTimeout(250);
        assert.deepEqual(
          await canvas.screenshot(),
          pausedFrame,
          `${site.name} did not pause its canvas`,
        );
        await page.getByRole('button', { name: 'Resume motion' }).click();
        await page.waitForTimeout(650);
        assert.notDeepEqual(
          await canvas.screenshot(),
          pausedFrame,
          `${site.name} did not resume its canvas`,
        );
      }

      await page.screenshot({
        path: `${output}${site.name}-${width}.png`,
        fullPage: width === 390 || width === 1440,
      });
      await context.close();
    }
  }

  const reducedContext = await browser.newContext({
    viewport: { width: 390, height: 900 },
    reducedMotion: 'reduce',
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(sites[0].url, { waitUntil: 'networkidle' });
  const hiddenReveals = await reducedPage
    .locator('[data-reveal]')
    .evaluateAll(
      (elements) =>
        elements.filter(
          (element) => Number.parseFloat(getComputedStyle(element).opacity) < 1,
        ).length,
    );
  assert.equal(hiddenReveals, 0, 'Reduced motion left hidden content');
  const dimReadingWords = await reducedPage
    .locator('.reading-word')
    .evaluateAll(
      (elements) =>
        elements.filter(
          (element) => getComputedStyle(element).color !== 'rgb(17, 24, 32)',
        ).length,
    );
  assert.equal(
    dimReadingWords,
    0,
    'Reduced motion left the reading reveal incomplete',
  );
  assert.ok(
    await reducedPage
      .locator('[data-three-frame]')
      .evaluate(
        (element) =>
          element.classList.contains('is-rendered') ||
          element.classList.contains('is-unavailable'),
      ),
    'Reduced motion did not resolve the static Three.js frame',
  );
  await reducedContext.close();

  const recoveryContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const recoveryPage = await recoveryContext.newPage();
  await recoveryPage.goto(sites[0].url, { waitUntil: 'networkidle' });
  await recoveryPage.locator('.three-scene.is-rendered').waitFor();
  await recoveryPage.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const extension = canvas
      .getContext('webgl2')
      .getExtension('WEBGL_lose_context');
    extension.loseContext();
    setTimeout(() => extension.restoreContext(), 500);
  });
  await recoveryPage.locator('.three-scene.is-unavailable').waitFor();
  await recoveryPage.locator('.three-scene.is-rendered').waitFor();
  await recoveryPage.getByRole('button', { name: 'Pause motion' }).click();
  assert.equal(
    await recoveryPage.locator('.motion-toggle').getAttribute('aria-pressed'),
    'true',
  );
  await recoveryContext.close();

  const staticContext = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 900 },
  });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(sites[0].url, { waitUntil: 'networkidle' });
  assert.ok(
    await staticPage.locator('.three-scene__fallback img').isVisible(),
    'No-JavaScript fallback is missing',
  );
  assert.ok(
    await staticPage
      .locator('.three-scene__fallback img')
      .evaluate((image) => image.complete && image.naturalWidth > 0),
    'No-JavaScript poster did not load',
  );
  assert.equal(
    await staticPage.locator('.motion-toggle').isVisible(),
    false,
    'No-JavaScript page exposes a dead motion button',
  );
  await staticContext.close();

  const detailRoutes = [
    { site: sites[0], slug: 'logo-study', route: '/logo-study/' },
    { site: sites[0], slug: 'privacy', route: '/privacy/' },
    { site: sites[1], slug: 'guides', route: '/blog/' },
    { site: sites[1], slug: 'cloudy-day-uv', route: '/blog/cloudy-day-uv/' },
    { site: sites[2], slug: 'guides', route: '/blog/' },
    {
      site: sites[2],
      slug: 'personal-affirmation',
      route: '/blog/write-a-personal-affirmation/',
    },
  ];
  for (const detail of detailRoutes) {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: width === 390 ? 900 : 1000 },
      });
      const page = await context.newPage();
      const runtimeErrors = [];
      page.on('pageerror', (error) => runtimeErrors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') runtimeErrors.push(message.text());
      });
      const response = await page.goto(`${detail.site.url}${detail.route}`, {
        waitUntil: 'networkidle',
      });
      assert.equal(
        response?.status(),
        200,
        `${detail.site.name}${detail.route} returned ${response?.status()}`,
      );
      await page
        .locator('[data-reveal]')
        .evaluateAll((elements) =>
          elements.forEach((element) => element.classList.add('is-visible')),
        );
      await page.waitForTimeout(1300);
      await page.locator('img').evaluateAll((images) =>
        images.forEach((image) => {
          image.loading = 'eager';
        }),
      );
      await page.waitForFunction(() =>
        [...document.images].every((image) => image.complete),
      );
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      assert.ok(
        overflow <= 1,
        `${detail.site.name}${detail.route} overflows by ${overflow}px at ${width}px`,
      );
      const brokenImages = await page
        .locator('img')
        .evaluateAll((images) =>
          images
            .filter((image) => image.naturalWidth === 0)
            .map((image) => image.src),
        );
      assert.deepEqual(
        brokenImages,
        [],
        `${detail.site.name}${detail.route} has broken images at ${width}px`,
      );
      assert.deepEqual(
        runtimeErrors,
        [],
        `${detail.site.name}${detail.route} logged runtime errors at ${width}px`,
      );
      await assertAnimatedHeadingReadable(
        page,
        `${detail.site.name}${detail.route} at ${width}px`,
      );
      await assertLightTheme(
        page,
        `${detail.site.name}${detail.route} at ${width}px`,
      );
      await page.screenshot({
        path: `${output}${detail.site.name}-${detail.slug}-${width}.png`,
        fullPage: true,
      });
      await context.close();
    }
  }

  for (const site of sites) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const routes =
      site.name === 'company'
        ? ['/', '/logo-study/', '/support/', '/privacy/', '/terms/']
        : [
            '/',
            '/blog/',
            '/support/',
            '/privacy/',
            '/terms/',
            '/rss.xml',
            '/sitemap.xml',
          ];
    for (const route of routes) {
      const response = await page.goto(`${site.url}${route}`, {
        waitUntil: 'domcontentloaded',
      });
      assert.equal(
        response?.status(),
        200,
        `${site.name}${route} returned ${response?.status()}`,
      );
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
        const page = await context.newPage();
        const response = await page.goto(site.url, {
          waitUntil: 'networkidle',
        });
        assert.equal(
          response?.status(),
          200,
          `${site.name} failed in ${engine.name}`,
        );
        await page
          .locator('[data-reveal]')
          .evaluateAll((elements) =>
            elements.forEach((element) => element.classList.add('is-visible')),
          );
        await page.locator('img').evaluateAll((images) =>
          images.forEach((image) => {
            image.loading = 'eager';
          }),
        );
        await page.waitForFunction(() =>
          [...document.images].every((image) => image.complete),
        );
        await page.waitForTimeout(850);
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        assert.ok(
          overflow <= 1,
          `${site.name} overflows by ${overflow}px in ${engine.name} at ${width}px`,
        );
        const brokenImages = await page
          .locator('img')
          .evaluateAll((images) =>
            images
              .filter((image) => image.naturalWidth === 0)
              .map((image) => image.src),
          );
        assert.deepEqual(
          brokenImages,
          [],
          `${site.name} has broken images in ${engine.name} at ${width}px`,
        );
        await page.screenshot({
          path: `${output}${site.name}-${engine.name}-${width}.png`,
          fullPage: width === 390,
        });
        await context.close();
      }
    }
  } finally {
    await engineBrowser.close();
  }
}

console.log('Firefox and WebKit QA passed at desktop and mobile widths.');
