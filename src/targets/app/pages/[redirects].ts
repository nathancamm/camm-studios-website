import type { APIRoute } from 'astro';
import type { AppTarget } from '@shared/data/app-definition';

const target = process.env.SITE_TARGET as AppTarget;

// The apps link to their legal documents on the live company site. Until those
// documents move to the app subdomains, Cloudflare sends /privacy and /terms to
// the same versions. Remove this file when the company site moves to this
// repository, or vercel.json's legacy redirects will loop with these rules.
const legalBase: Record<AppTarget, string> = {
  bronzed: 'https://www.cammstudios.com/apps/bronzed',
  stellar: 'https://www.cammstudios.com/apps/manifest',
};

// Astro ignores page files that start with an underscore, so the Cloudflare
// `_redirects` file is generated through a dynamic route.
export const getStaticPaths = () => [{ params: { redirects: '_redirects' } }];

export const GET: APIRoute = () => {
  const rules = ['privacy', 'terms'].flatMap((document) => [
    `/${document} ${legalBase[target]}/${document}.html 302`,
    `/${document}/ ${legalBase[target]}/${document}.html 302`,
  ]);
  return new Response(`${rules.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
