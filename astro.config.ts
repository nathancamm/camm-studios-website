import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const targets = {
  company: 'https://www.cammstudios.com',
  bronzed: 'https://bronzed.cammstudios.com',
  stellar: 'https://stellar.cammstudios.com',
} as const;

const target = process.env.SITE_TARGET;

if (!target || !(target in targets)) {
  throw new Error('SITE_TARGET must be company, bronzed, or stellar.');
}

const source = target === 'company' ? './src/targets/company' : './src/targets/app';
const appData = target === 'stellar'
  ? './src/shared/data/apps/stellar.ts'
  : './src/shared/data/apps/bronzed.ts';

export default defineConfig({
  integrations: [react()],
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
