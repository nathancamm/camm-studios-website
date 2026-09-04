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
      assert.doesNotMatch(
        html,
        /href=["']#["']/i,
        `${target}/${file} has a dead link`,
      );

      if (file !== '404.html') {
        assert.match(
          html,
          new RegExp(
            `<link[^>]+rel=["']canonical["'][^>]+href=["']${canonicalHosts[target].replaceAll('.', '\\.')}[^"']*["']`,
            'i',
          ),
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
      const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map(
        (match) => match[1],
      );

      for (const href of hrefs) {
        if (href.startsWith('#')) {
          const id = href.slice(1);
          assert.match(
            html,
            new RegExp(`id=["']${id}["']`),
            `${target}/${file} has a missing #${id} anchor`,
          );
          continue;
        }
        if (!href.startsWith('/')) continue;

        const path = href.split(/[?#]/, 1)[0];
        const candidate =
          path === '/'
            ? 'index.html'
            : path.endsWith('/')
              ? `${path.slice(1)}index.html`
              : path.includes('.')
                ? path.slice(1)
                : `${path.slice(1)}/index.html`;
        assert.ok(
          existsSync(join(outDir, candidate)),
          `${target}/${file} links to missing ${href}`,
        );
      }
    }
  }
});

test('metadata and structured data match each public surface', () => {
  for (const [target, files] of Object.entries(routeFiles)) {
    for (const file of files.filter(
      (path) => path.endsWith('.html') && path !== '404.html',
    )) {
      const html = readFileSync(join(root, 'dist', target, file), 'utf8');
      assert.match(
        html,
        /<meta name="description" content="[^"]+"/i,
        `${target}/${file} has no description`,
      );
      assert.match(
        html,
        /<meta property="og:title" content="[^"]+"/i,
        `${target}/${file} has no Open Graph title`,
      );
    }
  }

  const company = readFileSync(join(root, 'dist/company/index.html'), 'utf8');
  const bronzed = readFileSync(join(root, 'dist/bronzed/index.html'), 'utf8');
  const stellarPost = readFileSync(
    join(root, 'dist/stellar/blog/369-method-daily-ritual/index.html'),
    'utf8',
  );
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

test('company shows proprietary names without exposing operational details', () => {
  const company = readFileSync(join(root, 'dist/company/index.html'), 'utf8');
  assert.match(company, /href="#apps"/);
  assert.match(company, /Artemis/);
  assert.match(company, /Atlas/);
  assert.doesNotMatch(
    company,
    /keyword research|marketing attribution|data layer|system-node__detail|Planned/i,
  );
  assert.match(company, /data-three-scene="monogram"/);
  assert.doesNotMatch(
    company,
    /keyword opportunities|prediction model|portfolio scoring/i,
  );
});

test('five clear glass logo concepts have downloadable artwork', () => {
  const study = readFileSync(
    join(root, 'dist/company/logo-study/index.html'),
    'utf8',
  );
  assert.equal(
    (study.match(/<article class="logo-concept(?:"|\s)/g) ?? []).length,
    5,
  );
  assert.equal((study.match(/ download(?:[ >])/g) ?? []).length, 5);
  assert.match(study, /noindex, nofollow/);
  assert.doesNotMatch(study, /robotic|serpent/i);
});

test('the primary Blender model is a valid, bounded glTF binary', () => {
  const path = join(root, 'dist/company/models/camm-crystal.glb');
  assert.ok(existsSync(path), 'Primary crystal model must ship with the site');
  const model = readFileSync(path);
  assert.equal(model.toString('utf8', 0, 4), 'glTF');
  assert.equal(model.readUInt32LE(4), 2);
  assert.equal(model.readUInt32LE(8), model.length);
  const document = JSON.parse(
    model.toString('utf8', 20, 20 + model.readUInt32LE(12)),
  );
  assert.ok(
    document.animations?.some((clip) => /assemble/i.test(clip.name)),
    'Snake needs its arrival and assembly animation',
  );
  assert.ok(
    document.animations?.some((clip) => /idle/i.test(clip.name)),
    'Snake needs a separate idle animation',
  );
  assert.ok(model.length < 2_500_000, 'Hero model exceeds 2.5 MB');
});

test('all page canonicals use the configured trailing slash', () => {
  for (const [target, files] of Object.entries(routeFiles)) {
    for (const file of files.filter(
      (path) => path.endsWith('.html') && path !== '404.html',
    )) {
      const html = readFileSync(join(root, 'dist', target, file), 'utf8');
      const url = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
      assert.ok(
        url?.endsWith('/'),
        `${target}/${file} canonical lacks a trailing slash`,
      );
    }
  }
});

test('each app has its own Three.js product world and at least three SEO articles', () => {
  for (const target of ['bronzed', 'stellar']) {
    const home = readFileSync(join(root, 'dist', target, 'index.html'), 'utf8');
    const journal = readFileSync(
      join(root, 'dist', target, 'blog/index.html'),
      'utf8',
    );
    assert.match(home, new RegExp(`data-three-scene=["']${target}["']`, 'i'));
    assert.ok(
      (journal.match(/class=["'][^"']*post-card/g) ?? []).length >= 3,
      `${target} needs at least three journal articles`,
    );
  }
});

test('each target emits only the large artwork it actually renders', () => {
  const assetsFor = (target) =>
    readdirSync(join(root, 'dist', target, '_astro'));
  const companyAssets = assetsFor('company');
  const bronzedAssets = assetsFor('bronzed');
  const stellarAssets = assetsFor('stellar');

  assert.ok(
    companyAssets.every((asset) => !/(?:screenshot|system|blog-)/.test(asset)),
    `Company build contains unused product artwork: ${companyAssets.filter((asset) => /(?:screenshot|system|blog-)/.test(asset)).join(', ')}`,
  );
  assert.ok(
    bronzedAssets.every(
      (asset) => !/(?:stellar-(?:icon|screenshot|system)|blog-369)/.test(asset),
    ),
    `Bronzed build contains Stellar artwork: ${bronzedAssets.filter((asset) => /(?:stellar-(?:icon|screenshot|system)|blog-369)/.test(asset)).join(', ')}`,
  );
  assert.ok(
    stellarAssets.every(
      (asset) => !/(?:bronzed-(?:icon|screenshot|system)|blog-uv)/.test(asset),
    ),
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
  const scene = readFileSync(
    join(root, 'src/shared/scripts/three-scenes.ts'),
    'utf8',
  );
  const company = readFileSync(join(root, 'dist/company/index.html'), 'utf8');

  assert.match(scene, /prefers-reduced-motion:\s*reduce/);
  assert.match(scene, /IntersectionObserver/);
  assert.match(company, /<canvas[^>]+aria-label=/i);
});

test('legacy app legal routes redirect permanently to final subdomains', () => {
  const config = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  const redirects = new Map(
    config.redirects.map((redirect) => [redirect.source, redirect]),
  );

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
        assert.ok(
          !redirect.destination.includes('?'),
          `Redirect should let Vercel preserve the original query for ${source}`,
        );
      }
    }
  }

  const apexRuleIndex = config.redirects.findIndex((redirect) =>
    redirect.has?.some((condition) => condition.type === 'host'),
  );
  const lastLegacyIndex = Math.max(
    ...groups.flatMap(([app, document]) =>
      ['.html', '', '/'].map((suffix) =>
        config.redirects.findIndex(
          (redirect) => redirect.source === `/apps/${app}/${document}${suffix}`,
        ),
      ),
    ),
  );
  assert.ok(
    lastLegacyIndex < apexRuleIndex,
    'Apex host redirect would create a chain before legacy legal redirects',
  );
});
