import type { APIRoute } from 'astro';
import { renderSitemap } from '@shared/lib/sitemap';

export const GET: APIRoute = () => {
  const body = renderSitemap(['/', '/support', '/privacy', '/terms']);
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
