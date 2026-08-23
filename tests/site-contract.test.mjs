import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
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

test('the private logo study contains five source-grounded robotic snake directions', () => {
  const study = readFileSync(join(root, 'dist/company/logo-study/index.html'), 'utf8');
  const conceptsDir = join(root, 'src/shared/assets/brand/concepts');
  const concepts = readdirSync(conceptsDir).filter((file) => file.endsWith('.webp'));
  assert.equal((study.match(/<article class="logo-concept(?:"|\s)/g) ?? []).length, 5);
  assert.equal(concepts.length, 5);
  assert.match(study, /noindex, nofollow/i);
  assert.match(study, /C-shaped snake/i);
  for (const name of ['Vertebra Lock', 'Nerve Rail', 'Servo Snout', 'Maglock Coil', 'Iris Sentinel']) {
    assert.match(study, new RegExp(`>${name}<`, 'i'), `Logo study is missing ${name}`);
  }
  assert.doesNotMatch(study, /Prism Terminals|Aperture Step|Inner Halo|Equator Split|Crown Facet/i);
  for (const file of concepts) {
    assert.ok(statSync(join(conceptsDir, file)).size > 20_000, `${file} is not a finished logo render`);
  }
});

test('Vertebra Lock is the selected live identity and uses an authored 3D model', () => {
  const brand = readFileSync(join(root, 'src/shared/components/Brand.astro'), 'utf8');
  const layout = readFileSync(join(root, 'src/shared/layouts/BaseLayout.astro'), 'utf8');
  const company = readFileSync(join(root, 'src/targets/company/pages/index.astro'), 'utf8');
  const study = readFileSync(join(root, 'src/targets/company/pages/logo-study.astro'), 'utf8');
  const scene = readFileSync(join(root, 'src/shared/scripts/three-scenes.ts'), 'utf8');
  const model = join(root, 'src/shared/assets/models/camm-robotic-snake.glb');

  for (const source of [brand, layout, company]) {
    assert.match(source, /vertebra-lock\.webp/);
    assert.doesNotMatch(source, /mark\.png/);
  }
  assert.match(study, /data-selected/);
  assert.match(study, /01 \/ Selected/);
  assert.match(company, /camm-robotic-snake\.glb/);
  assert.match(scene, /GLTFLoader/);
  assert.match(scene, /SnakeHead/);
  assert.match(scene, /SnakeEye/);
  assert.ok(existsSync(model), 'Missing the authored Camm snake model');
  assert.ok(statSync(model).size > 50_000, 'The Camm snake model is too small to contain authored detail');
});

test('each app hero uses its own authored Blender model', () => {
  const scene = readFileSync(join(root, 'src/shared/scripts/three-scenes.ts'), 'utf8');
  const expected = {
    bronzed: 'bronzed-solar-dial.glb',
    stellar: 'stellar-star-compass.glb',
  };

  for (const [target, filename] of Object.entries(expected)) {
    const definition = readFileSync(join(root, 'src/shared/data/apps', `${target}.ts`), 'utf8');
    const model = join(root, 'src/shared/assets/models', filename);
    assert.match(definition, new RegExp(filename.replace('.', '\\.')));
    assert.ok(existsSync(model), `Missing ${target} authored hero model`);
    assert.ok(statSync(model).size > 50_000, `${filename} is too small to contain authored detail`);
  }

  for (const part of ['SolarCore', 'SolarCorona', 'SolarOrbit', 'SolarGnomon', 'StarCore', 'StarOrbit', 'StarNode03', 'StarNode06', 'StarNode09']) {
    assert.match(scene, new RegExp(part), `Three.js motion is missing ${part}`);
  }
  assert.doesNotMatch(scene, /HeliostatLens|FilterCarriage|LoomLeafMorning|LoomPrism/);
});

test('supporting surfaces use finished image assets instead of CSS drawings', () => {
  const system = readFileSync(join(root, 'src/shared/components/SystemCard.astro'), 'utf8');
  const company = readFileSync(join(root, 'src/targets/company/pages/index.astro'), 'utf8');
  const app = readFileSync(join(root, 'src/targets/app/pages/index.astro'), 'utf8');
  const journal = readFileSync(join(root, 'src/targets/app/pages/blog/index.astro'), 'utf8');
  const article = readFileSync(join(root, 'src/targets/app/pages/blog/[slug].astro'), 'utf8');

  assert.match(system, /<Image[^>]+src=\{art\}/s);
  assert.match(company, /portalArt/);
  assert.match(app, /instrumentArt/);
  assert.match(journal, /guideArt/);
  assert.match(article, /guideArt/);

  const systemAssets = readdirSync(join(root, 'src/shared/assets/art/systems')).filter((file) => file.endsWith('.webp'));
  const guideAssets = readdirSync(join(root, 'src/shared/assets/art/guides')).filter((file) => file.endsWith('.webp'));
  const productAssets = readdirSync(join(root, 'src/shared/assets/art/products')).filter((file) => file.endsWith('.webp'));
  assert.deepEqual(systemAssets.sort(), [
    'artemis-signal-bow.webp',
    'atlas-orbit-stack.webp',
    'chronos-cadence-ring.webp',
    'morpheus-dream-ribbon.webp',
  ]);
  assert.deepEqual(guideAssets.sort(), [
    'bronzed-cloud-filter.webp',
    'bronzed-spf-shield.webp',
    'bronzed-uv-scale.webp',
    'stellar-369-orbit.webp',
    'stellar-affirmation-resonator.webp',
    'stellar-vision-constellation.webp',
  ]);
  assert.deepEqual(productAssets.sort(), [
    'bronzed-solar-symbol.webp',
    'stellar-star-symbol.webp',
  ]);
});

test('the Three.js worlds load authored models into a calibrated optical stage', () => {
  const scene = readFileSync(join(root, 'src/shared/scripts/three-scenes.ts'), 'utf8');
  assert.match(scene, /RoomEnvironment/);
  assert.match(scene, /PMREMGenerator/);
  assert.match(scene, /GLTFLoader/);
  assert.match(scene, /dataset\.modelUrl/);
  assert.match(scene, /loadAsync/);
  assert.match(scene, /Box3/);
  assert.match(scene, /model\.getObjectByName/);
});

test('finished artwork has restrained depth motion and reduced-motion safeguards', () => {
  const systems = readFileSync(join(root, 'src/shared/components/SystemCard.astro'), 'utf8');
  const company = readFileSync(join(root, 'src/targets/company/pages/index.astro'), 'utf8');
  const journal = readFileSync(join(root, 'src/targets/app/pages/blog/index.astro'), 'utf8');
  const companyCss = readFileSync(join(root, 'src/shared/styles/company.css'), 'utf8');
  const blogCss = readFileSync(join(root, 'src/shared/styles/blog.css'), 'utf8');
  const appCss = readFileSync(join(root, 'src/shared/styles/app.css'), 'utf8');

  assert.doesNotMatch(systems, /<svg\b/);
  assert.match(systems, /system-card__art/);
  assert.match(company, /app-portal__art/);
  assert.match(journal, /post-card__art/);
  assert.match(companyCss, /@keyframes portal-art-drift/);
  assert.match(blogCss, /@keyframes journal-art-drift/);
  assert.match(appCss, /@keyframes product-art-drift/);
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
