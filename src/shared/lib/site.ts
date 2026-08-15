export type SiteTarget = 'company' | 'bronzed' | 'stellar';

/** Injected at build time from astro.config.mjs. */
export const target: SiteTarget = import.meta.env.SITE_TARGET as SiteTarget;

export const SITE_URLS: Record<SiteTarget, string> = {
  company: 'https://www.cammstudios.com',
  bronzed: 'https://bronzed.cammstudios.com',
  stellar: 'https://stellar.cammstudios.com',
};

/** Canonical absolute URL for a path on the current site. */
export function canonical(path: string): string {
  const clean = path.replace(/\.html$/, '').replace(/\/index$/, '') || '/';
  return new URL(clean, SITE_URLS[target]).href;
}
