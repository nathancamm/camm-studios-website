// Internal link check across built sites, honoring Vercel cleanUrls.
// Run: node scripts/qa-links.mjs
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, posix } from 'node:path';

const HOSTS = {
  'https://www.cammstudios.com': 'dist/company',
  'https://bronzed.cammstudios.com': 'dist/bronzed',
  'https://stellar.cammstudios.com': 'dist/stellar',
};

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir)) {
    const p = join(dir, entry);
    const s = await stat(p);
    if (s.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (entry.endsWith('.html')) out.push(p);
  }
  return out;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function resolves(root, pathname) {
  const clean = pathname.replace(/\/$/, '') || '/';
  const candidates =
    clean === '/'
      ? [join(root, 'index.html')]
      : [join(root, clean), join(root, `${clean}.html`), join(root, clean, 'index.html')];
  for (const c of candidates) if (await exists(c)) return true;
  return false;
}

const problems = [];
for (const [host, root] of Object.entries(HOSTS)) {
  for (const file of await htmlFiles(root)) {
    const html = await readFile(file, 'utf8');
    const hrefs = [...html.matchAll(/(?:href|src)="([^"#]+)"/g)].map((m) => m[1]);
    for (const href of hrefs) {
      if (href.startsWith('mailto:') || href.startsWith('data:')) continue;
      let target = null;
      if (href.startsWith('/')) target = { root, pathname: href };
      else if (href.startsWith('http')) {
        for (const [h, r] of Object.entries(HOSTS)) {
          if (href === h || href.startsWith(`${h}/`)) {
            target = { root: r, pathname: href.slice(h.length) || '/' };
          }
        }
      }
      if (!target) continue;
      if (target.pathname.startsWith('/_vercel')) continue;
      if (!(await resolves(target.root, posix.normalize(target.pathname)))) {
        problems.push(`${file}: ${href}`);
      }
    }
  }
}
console.log(problems.length ? problems.join('\n') : 'all internal links resolve');
