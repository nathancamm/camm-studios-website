import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderRss } from '@shared/lib/rss';
import { bronzed } from '@shared/data/apps';

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const body = renderRss({
    title: 'The Bronzed blog',
    description: 'Sun, UV, and smart tanning, explained by the Bronzed team at Camm Studios.',
    site: bronzed.site,
    items: posts
      .sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime())
      .map((post) => ({
        title: post.data.title,
        url: `${bronzed.site}/blog/${post.id}`,
        date: post.data.publishDate,
        summary: post.data.summary,
      })),
  });
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
