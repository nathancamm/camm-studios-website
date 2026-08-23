import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url).pathname;

const routeFiles = {
  company: [
    'index.html',
    'logo-study/index.html',
    'support/index.html',
    'privacy/index.html',
    'terms/index.html',
    '404.html',
    'robots.txt',
    'sitemap.xml',
  ],
  bronzed: [
    'index.html',
    'blog/index.html',
    'blog/uv-index-explained/index.html',
    'blog/cloudy-day-uv/index.html',
    'blog/sunscreen-spf-and-uv-index/index.html',
    'support/index.html',
    'privacy/index.html',
    'terms/index.html',
    '404.html',
    'robots.txt',
    'rss.xml',
    'sitemap.xml',
  ],
  stellar: [
    'index.html',
    'blog/index.html',
    'blog/369-method-daily-ritual/index.html',
    'blog/write-a-personal-affirmation/index.html',
    'blog/vision-board-routine/index.html',
    'support/index.html',
    'privacy/index.html',
    'terms/index.html',
    '404.html',
    'robots.txt',
    'rss.xml',
    'sitemap.xml',
  ],
};

const canonicalHosts = {
  company: 'https://www.cammstudios.com',
  bronzed: 'https://bronzed.cammstudios.com',
  stellar: 'https://stellar.cammstudios.com',
};

test('every target emits its complete public route set', () => {
  for (const [target, files] of Object.entries(routeFiles)) {
    const outDir = join(root, 'dist', target);
    assert.ok(existsSync(outDir), `Missing ${target} build at ${outDir}`);

    for (const file of files) {
      assert.ok(existsSync(join(outDir, file)), `${target} is missing ${file}`);
    }
  }
});

test('each HTML document uses its target canonical host and has no dead links', () => {
  for (const [target, files] of Object.entries(routeFiles)) {
    for (const file of files.filter((path) => path.endsWith('.html'))) {
      const html = readFileSync(join(root, 'dist', target, file), 'utf8');
      assert.doesNotMatch(html, /href=["']#["']/i, `${target}/${file} has a dead link`);

      if (file !== '404.html') {
        assert.match(
          html,
          new RegExp(`<link[^>]+rel=["']canonical["'][^>]+href=["']${canonicalHosts[target].replaceAll('.', '\\.')}[^"']*["']`, 'i'),
          `${target}/${file} has the wrong canonical host`,
        );
      }
    }
  }
});

test('internal links and same-page anchors resolve', () => {
  for (const [target, files] of Object.entries(routeFiles)) {
    const outDir = join(root, 'dist', target);
    for (const file of files.filter((path) => path.endsWith('.html'))) {
      const html = readFileSync(join(outDir, file), 'utf8');
      const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1]);

      for (const href of hrefs) {
        if (href.startsWith('#')) {
          const id = href.slice(1);
          assert.match(html, new RegExp(`id=["']${id}["']`), `${target}/${file} has a missing #${id} anchor`);
          continue;
        }
        if (!href.startsWith('/')) continue;

        const path = href.split(/[?#]/, 1)[0];
        const candidate = path === '/'
          ? 'index.html'
          : path.endsWith('/')
            ? `${path.slice(1)}index.html`
            : path.includes('.')
              ? path.slice(1)
              : `${path.slice(1)}/index.html`;
        assert.ok(existsSync(join(outDir, candidate)), `${target}/${file} links to missing ${href}`);
      }
    }
  }
});

test('metadata and structured data match each public surface', () => {
  for (const [target, files] of Object.entries(routeFiles)) {
    for (const file of files.filter((path) => path.endsWith('.html') && path !== '404.html')) {
      const html = readFileSync(join(root, 'dist', target, file), 'utf8');
      assert.match(html, /<meta name="description" content="[^"]+"/i, `${target}/${file} has no description`);
      assert.match(html, /<meta property="og:title" content="[^"]+"/i, `${target}/${file} has no Open Graph title`);
    }
  }

  const company = readFileSync(join(root, 'dist/company/index.html'), 'utf8');
  const bronzed = readFileSync(join(root, 'dist/bronzed/index.html'), 'utf8');
  const stellarPost = readFileSync(join(root, 'dist/stellar/blog/369-method-daily-ritual/index.html'), 'utf8');
  assert.match(company, /"@type":"Organization"/);
  assert.match(bronzed, /"@type":"MobileApplication"/);
  assert.match(stellarPost, /"@type":"BlogPosting"/);
  assert.match(stellarPost, /"@type":"BreadcrumbList"/);
});

test('product pages use the live locale neutral App Store links', () => {
  const bronzed = readFileSync(join(root, 'dist/bronzed/index.html'), 'utf8');
  const stellar = readFileSync(join(root, 'dist/stellar/index.html'), 'utf8');

  assert.match(bronzed, /https:\/\/apps\.apple\.com\/app\/id6788585058/);
  assert.match(stellar, /https:\/\/apps\.apple\.com\/app\/id6759896200/);
});

test('company page leads with the studio operating model', () => {
  const company = readFileSync(join(root, 'dist/company/index.html'), 'utf8');
  assert.match(company, /See how we operate/i);
  assert.match(company, /consumer apps that compound/i);
  assert.match(company, /From signal to software to scale/i);
});

test('every rendered page declares the cool light color scheme', () => {
  for (const [target, files] of Object.entries(routeFiles)) {
    for (const file of files.filter((path) => path.endsWith('.html'))) {
      const html = readFileSync(join(root, 'dist', target, file), 'utf8');
      assert.match(html, /<meta name="color-scheme" content="light"/i, `${target}/${file} is not light themed`);
      assert.match(html, /<meta name="theme-color" content="#f7f9fc"/i, `${target}/${file} has the wrong browser chrome color`);
    }
  }
});

test('the light visual system uses a measured dot matrix for depth', () => {
  const css = readFileSync(join(root, 'src/shared/styles/global.css'), 'utf8');
  assert.match(css, /--canvas:\s*#f7f9fc/i);
  assert.match(css, /radial-gradient\(circle[^;]+var\(--dot\)/is);
  assert.match(css, /background-size:\s*[^;]*24px\s+24px/i);
});

test('the private logo study contains five neutral crystal C directions', () => {
  const study = readFileSync(join(root, 'dist/company/logo-study/index.html'), 'utf8');
  const concepts = readdirSync(join(root, 'src/shared/assets/brand/concepts')).filter((file) => file.endsWith('.svg'));
  assert.equal((study.match(/<article class="logo-concept(?:"|\s)/g) ?? []).length, 5);
  assert.equal(concepts.length, 5);
  assert.match(study, /noindex, nofollow/i);
  for (const name of ['Prism Terminals', 'Aperture Step', 'Inner Halo', 'Equator Split', 'Crown Facet']) {
    assert.match(study, new RegExp(`>${name}<`, 'i'), `Logo study is missing ${name}`);
  }
  assert.doesNotMatch(study, /Camm Lens|Aperture Stack|Glass Cable|Crystal Bracket|Iris Cut/i);
  for (const file of concepts) {
    const svg = readFileSync(join(root, 'src/shared/assets/brand/concepts', file), 'utf8');
    const vectorElements = svg.match(/<(?:path|ellipse|circle|line|rect|polygon)\b/g) ?? [];
    assert.doesNotMatch(svg, /#(?:f06a4f|8d95ee|8fc6ff|ffd6a8|cbd0ff)/i, `${file} contains a tinted brand color`);
    assert.match(svg, /data-camm-aperture=["']true["']/i, `${file} does not preserve the current C aperture`);
    assert.match(svg, /M51 16L43 23A15 15 0 1 0 43 41L51 48A25 25 0 1 1 51 16Z/i, `${file} does not include the current C silhouette`);
    assert.match(svg, /prefers-reduced-motion:\s*reduce/i, `${file} does not stop its optical animation`);
    assert.ok(vectorElements.length >= 12, `${file} needs more optical construction detail`);
  }
});

test('the Three.js worlds use image-based lighting and calibrated instrument geometry', () => {
  const scene = readFileSync(join(root, 'src/shared/scripts/three-scenes.ts'), 'utf8');
  assert.match(scene, /RoomEnvironment/);
  assert.match(scene, /PMREMGenerator/);
  assert.match(scene, /function makeCalibrationRing/);
  assert.match(scene, /function makeTickRing/);
  assert.match(scene, /function makeConstellation/);
  assert.match(scene, /function makeSolarInstrument/);
});

test('scientific card art has layered depth, sweep motion, and reduced-motion safeguards', () => {
  const systems = readFileSync(join(root, 'src/shared/components/SystemCard.astro'), 'utf8');
  const company = readFileSync(join(root, 'src/targets/company/pages/index.astro'), 'utf8');
  const journal = readFileSync(join(root, 'src/targets/app/pages/blog/index.astro'), 'utf8');
  const companyCss = readFileSync(join(root, 'src/shared/styles/company.css'), 'utf8');
  const blogCss = readFileSync(join(root, 'src/shared/styles/blog.css'), 'utf8');
  const appCss = readFileSync(join(root, 'src/shared/styles/app.css'), 'utf8');
  const systemVectors = systems.match(/<(?:path|ellipse|circle|line|rect|polygon)\b/g) ?? [];

  for (const className of ['diagram-grid', 'diagram-depth', 'diagram-pulse', 'diagram-sweep']) {
    assert.match(systems, new RegExp(className), `System cards are missing ${className}`);
  }
  assert.ok(systemVectors.length >= 80, 'System cards need denser instrument geometry');
  assert.match(company, /app-portal__instrument/);
  assert.match(journal, /post-card__instrument/);
  assert.match(companyCss, /@keyframes portal-instrument-orbit/);
  assert.match(blogCss, /@keyframes journal-instrument-scan/);
  assert.match(appCss, /@keyframes product-stage-scan/);
  for (const css of [companyCss, blogCss, appCss]) {
    assert.match(css, /prefers-reduced-motion:\s*reduce/i);
  }
});

test('the company site exposes the original glass monogram and real internal systems', () => {
  const company = readFileSync(join(root, 'dist/company/index.html'), 'utf8');

  assert.match(company, /data-three-scene=["']monogram["']/i);
  assert.match(company, /id=["']systems["']/i);
  for (const system of ['Artemis', 'Atlas', 'Morpheus', 'Chronos']) {
    assert.match(company, new RegExp(`>${system}<`, 'i'), `Company page is missing ${system}`);
  }
});

test('each app has its own Three.js product world and at least three SEO articles', () => {
  for (const target of ['bronzed', 'stellar']) {
    const home = readFileSync(join(root, 'dist', target, 'index.html'), 'utf8');
    const journal = readFileSync(join(root, 'dist', target, 'blog/index.html'), 'utf8');
    assert.match(home, new RegExp(`data-three-scene=["']${target}["']`, 'i'));
    assert.ok((journal.match(/class=["'][^"']*post-card/g) ?? []).length >= 3, `${target} needs at least three journal articles`);
  }
});

test('each target emits only the large artwork it actually renders', () => {
  const assetsFor = (target) => readdirSync(join(root, 'dist', target, '_astro'));
  const companyAssets = assetsFor('company');
  const bronzedAssets = assetsFor('bronzed');
  const stellarAssets = assetsFor('stellar');

  assert.ok(
    companyAssets.every((asset) => !/(?:screenshot|system|blog-)/.test(asset)),
    `Company build contains unused product artwork: ${companyAssets.filter((asset) => /(?:screenshot|system|blog-)/.test(asset)).join(', ')}`,
  );
  assert.ok(
    bronzedAssets.every((asset) => !/(?:stellar-(?:icon|screenshot|system)|blog-369)/.test(asset)),
    `Bronzed build contains Stellar artwork: ${bronzedAssets.filter((asset) => /(?:stellar-(?:icon|screenshot|system)|blog-369)/.test(asset)).join(', ')}`,
  );
  assert.ok(
    stellarAssets.every((asset) => !/(?:bronzed-(?:icon|screenshot|system)|blog-uv)/.test(asset)),
    `Stellar build contains Bronzed artwork: ${stellarAssets.filter((asset) => /(?:bronzed-(?:icon|screenshot|system)|blog-uv)/.test(asset)).join(', ')}`,
  );
  assert.ok(
    bronzedAssets.every((asset) => !/^bronzed-icon\..*\.png$/.test(asset)),
    'Bronzed emits its unoptimized source icon instead of an optimized social image.',
  );
  assert.ok(
    stellarAssets.every((asset) => !/^stellar-icon\..*\.png$/.test(asset)),
    'Stellar emits its unoptimized source icon instead of an optimized social image.',
  );
});

test('the cinematic layer includes a reduced motion path and a canvas fallback', () => {
  const scene = readFileSync(join(root, 'src/shared/scripts/three-scenes.ts'), 'utf8');
  const company = readFileSync(join(root, 'dist/company/index.html'), 'utf8');

  assert.match(scene, /prefers-reduced-motion:\s*reduce/);
  assert.match(scene, /IntersectionObserver/);
  assert.match(company, /<canvas[^>]+aria-label=/i);
});

test('legacy app legal routes redirect permanently to final subdomains', () => {
  const config = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  const redirects = new Map(config.redirects.map((redirect) => [redirect.source, redirect]));

  const groups = [
    ['bronzed', 'privacy', 'https://bronzed.cammstudios.com/privacy'],
    ['bronzed', 'terms', 'https://bronzed.cammstudios.com/terms'],
    ['manifest', 'privacy', 'https://stellar.cammstudios.com/privacy'],
    ['manifest', 'terms', 'https://stellar.cammstudios.com/terms'],
  ];

  for (const [app, document, destination] of groups) {
    for (const host of ['cammstudios.com', 'www.cammstudios.com']) {
      for (const suffix of ['.html', '', '/']) {
        const source = `/apps/${app}/${document}${suffix}`;
        const redirect = redirects.get(source);
        assert.ok(redirect, `Missing redirect for https://${host}${source}`);
        assert.equal(redirect.destination, destination);
        assert.equal(redirect.permanent, true);
        assert.ok(!redirect.destination.includes('?'), `Redirect should let Vercel preserve the original query for ${source}`);
      }
    }
  }

  const apexRuleIndex = config.redirects.findIndex((redirect) => redirect.has?.some((condition) => condition.type === 'host'));
  const lastLegacyIndex = Math.max(...groups.flatMap(([app, document]) => ['.html', '', '/'].map((suffix) => config.redirects.findIndex((redirect) => redirect.source === `/apps/${app}/${document}${suffix}`))));
  assert.ok(lastLegacyIndex < apexRuleIndex, 'Apex host redirect would create a chain before legacy legal redirects');
});
