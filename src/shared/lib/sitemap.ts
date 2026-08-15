import { SITE_URLS, target } from '@shared/lib/site';

/** Render a minimal, valid XML sitemap for the current site. */
export function renderSitemap(paths: string[], lastmod?: string): string {
  const base = SITE_URLS[target];
  const today = lastmod ?? new Date().toISOString().slice(0, 10);
  const urls = paths
    .map((path) => {
      const loc = new URL(path, base).href;
      return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod></url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderRobots(): string {
  const base = SITE_URLS[target];
  return `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`;
}
