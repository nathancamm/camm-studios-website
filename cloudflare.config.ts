import { defineConfig } from 'cf/config';

// Assets-only Worker for bronzed.cammstudios.com. Deploy with
// `npm run deploy:bronzed` (build:bronzed, then cf deploy ./dist/bronzed).
export default defineConfig({
  accountId: 'a39ac8e2a232198d92002002eccb0c15',
  worker: {
    name: 'bronzed-site',
    compatibilityDate: '2026-11-19',
    domains: ['bronzed.cammstudios.com'],
    workersDev: false,
    previewUrls: false,
    assets: {
      htmlHandling: 'force-trailing-slash',
      notFoundHandling: '404-page',
    },
  },
});
