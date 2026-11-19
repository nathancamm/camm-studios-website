import type { APIRoute } from 'astro';

// The apps link to the legal documents in legacy/company, which the build
// copies unchanged. Cloudflare serves foo.html at /foo/. /privacy and /terms point at those versions until new
// documents are approved. Old product and support URLs move to their new homes.
const rules = [
  '/index.html / 301',
  '/support.html /support/ 301',
  '/privacy /privacy-policy/ 302',
  '/privacy/ /privacy-policy/ 302',
  '/terms /terms-of-service/ 302',
  '/terms/ /terms-of-service/ 302',
  '/apps/bronzed https://bronzed.cammstudios.com/ 301',
  '/apps/bronzed/ https://bronzed.cammstudios.com/ 301',
  '/apps/bronzed/index.html https://bronzed.cammstudios.com/ 301',
];

// Astro ignores page files that start with an underscore, so the Cloudflare
// `_redirects` file is generated through a dynamic route.
export const getStaticPaths = () => [{ params: { redirects: '_redirects' } }];

export const GET: APIRoute = () =>
  new Response(`${rules.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
