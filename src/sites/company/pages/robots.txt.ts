import type { APIRoute } from 'astro';
import { renderRobots } from '@shared/lib/sitemap';

export const GET: APIRoute = () => {
  return new Response(renderRobots(), { headers: { 'Content-Type': 'text/plain' } });
};
