import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url).pathname;

const routeFiles = {
  company: [
    'index.html',
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

test('product pages use the live locale neutral App Store links', () => {
  const bronzed = readFileSync(join(root, 'dist/bronzed/index.html'), 'utf8');
  const stellar = readFileSync(join(root, 'dist/stellar/index.html'), 'utf8');

  assert.match(bronzed, /https:\/\/apps\.apple\.com\/app\/id6788585058/);
  assert.match(stellar, /https:\/\/apps\.apple\.com\/app\/id6759896200/);
});

test('company page leads with the approved process action', () => {
  const company = readFileSync(join(root, 'dist/company/index.html'), 'utf8');
  assert.match(company, /Read our process/i);
  assert.match(company, /We find overlooked problems/i);
  assert.match(company, /Small apps\. Clear purpose\. Built to get better\./i);
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
    for (const suffix of ['.html', '', '/']) {
      const source = `/apps/${app}/${document}${suffix}`;
      const redirect = redirects.get(source);
      assert.ok(redirect, `Missing redirect for ${source}`);
      assert.equal(redirect.destination, destination);
      assert.equal(redirect.permanent, true);
    }
  }
});

