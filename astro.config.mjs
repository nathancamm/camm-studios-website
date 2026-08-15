// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

/**
 * One repository builds three isolated static sites.
 * SITE_TARGET selects the page tree, the public dir, and the canonical host.
 */
const TARGETS = /** @type {const} */ ({
  company: 'https://www.cammstudios.com',
  bronzed: 'https://bronzed.cammstudios.com',
  stellar: 'https://stellar.cammstudios.com',
});

const target = process.env.SITE_TARGET ?? 'company';
if (!(target in TARGETS)) {
  throw new Error(`Unknown SITE_TARGET "${target}". Use company, bronzed, or stellar.`);
}
const site = TARGETS[/** @type {keyof typeof TARGETS} */ (target)];

export default defineConfig({
  site,
  srcDir: `./src/sites/${target}`,
  publicDir: `./public/${target}`,
  outDir: process.env.OUT_DIR ?? './dist',
  trailingSlash: 'never',
  build: { format: 'file' },
  vite: {
    resolve: {
      alias: {
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
        '@content': fileURLToPath(new URL('./content', import.meta.url)),
      },
    },
    define: {
      'import.meta.env.SITE_TARGET': JSON.stringify(target),
    },
  },
});
