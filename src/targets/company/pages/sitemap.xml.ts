import type { APIRoute } from 'astro';

// /privacy/ and /terms/ redirect to the legal pages in legacy/company.
const routes = ['/', '/support/', '/privacy-policy/', '/terms-of-service/'];

export const GET: APIRoute = ({ site }) => {
  const urls = routes.map((route) => `<url><loc>${new URL(route, site)}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
