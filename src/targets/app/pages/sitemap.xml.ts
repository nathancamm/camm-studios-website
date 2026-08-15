import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import type { AppTarget } from '@shared/data/apps';

const target = process.env.SITE_TARGET as AppTarget;

export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection('blog', ({ data }) => data.app === target && !data.draft);
  const routes = ['/', '/blog/', ...posts.map((post) => `/blog/${post.data.slug}/`), '/support/', '/privacy/', '/terms/'];
  const urls = routes.map((route) => `<url><loc>${new URL(route, site)}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
