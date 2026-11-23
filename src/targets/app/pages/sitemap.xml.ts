import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import type { AppTarget } from '@shared/data/app-definition';
import { sunburnCalculatorPath } from '@shared/data/app-nav';

const target = process.env.SITE_TARGET as AppTarget;

export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection('blog', ({ data }) => data.app === target && !data.draft);
  // Privacy and terms redirect to the company site (see _redirects.ts).
  const toolRoutes = target === 'bronzed' ? [sunburnCalculatorPath] : [];
  const staticRoutes = ['/', ...toolRoutes, '/blog/', '/support/'];
  const staticUrls = staticRoutes.map((route) => `<url><loc>${new URL(route, site)}</loc></url>`);
  const articleUrls = posts.map((post) => `<url><loc>${new URL(`/blog/${post.data.slug}/`, site)}</loc><lastmod>${post.data.updatedDate.toISOString()}</lastmod></url>`);
  const urls = [...staticUrls, ...articleUrls].join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
