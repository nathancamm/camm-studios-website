import { defineConfig } from 'cf/config';

// Assets-only Workers for the sites that run on Cloudflare. Deploy with
// `npm run deploy:company` or `npm run deploy:bronzed`; the script sets
// SITE_TARGET. cammstudios.com itself redirects to www with a zone redirect rule.
const workers: Record<'company' | 'bronzed', { name: string; domains: string[] }> = {
  company: { name: 'camm-studios-site', domains: ['www.cammstudios.com'] },
  bronzed: { name: 'bronzed-site', domains: ['bronzed.cammstudios.com'] },
};

const target = process.env.SITE_TARGET;
if (target !== 'company' && target !== 'bronzed') {
  throw new Error('Set SITE_TARGET to company or bronzed before deploying.');
}

export default defineConfig({
  accountId: 'a39ac8e2a232198d92002002eccb0c15',
  worker: {
    ...workers[target],
    compatibilityDate: '2026-11-19',
    workersDev: false,
    previewUrls: false,
    assets: {
      htmlHandling: 'force-trailing-slash',
      notFoundHandling: '404-page',
    },
  },
});
