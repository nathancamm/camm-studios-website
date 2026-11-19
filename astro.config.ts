import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

const targets = {
  company: 'https://www.cammstudios.com',
  bronzed: 'https://bronzed.cammstudios.com',
  stellar: 'https://stellar.cammstudios.com',
} as const;

const target = process.env.SITE_TARGET;

if (!target || !(target in targets)) {
  throw new Error('SITE_TARGET must be company, bronzed, or stellar.');
}

// The company site keeps serving the legal pages the apps link to, unchanged,
// from legacy/company. They are copied into the build output as-is.
const legacyPages: AstroIntegration = {
  name: 'legacy-pages',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      if (target !== 'company') return;
      const from = fileURLToPath(new URL('./legacy/company/', import.meta.url));
      const to = fileURLToPath(dir);
      const entries = await readdir(from, { recursive: true, withFileTypes: true });
      for (const entry of entries.filter((item) => item.isFile())) {
        const path = join(entry.parentPath, entry.name).slice(from.length);
        await mkdir(dirname(join(to, path)), { recursive: true });
        // COPYFILE_EXCL fails the build if a legacy file would replace a generated one.
        await copyFile(join(from, path), join(to, path), constants.COPYFILE_EXCL);
      }
    },
  },
};

const source = target === 'company' ? './src/targets/company' : './src/targets/app';
const appData = target === 'stellar'
  ? './src/shared/data/apps/stellar.ts'
  : './src/shared/data/apps/bronzed.ts';

export default defineConfig({
  integrations: [react(), legacyPages],
  site: targets[target as keyof typeof targets],
  srcDir: source,
  outDir: `./dist/${target}`,
  cacheDir: `./node_modules/.astro/${target}`,
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  build: {
    format: 'directory',
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@shared': new URL('./src/shared', import.meta.url).pathname,
        '@app-data': new URL(appData, import.meta.url).pathname,
      },
    },
  },
});
