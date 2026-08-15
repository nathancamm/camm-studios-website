import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderSitemap } from '@shared/lib/sitemap';

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const body = renderSitemap([
    '/',
    '/blog',
    ...posts.map((post) => `/blog/${post.id}`),
    '/support',
    '/privacy',
    '/terms',
  ]);
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
