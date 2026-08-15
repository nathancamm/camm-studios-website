import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderRss } from '@shared/lib/rss';
import { stellar } from '@shared/data/apps';

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const body = renderRss({
    title: 'The Stellar blog',
    description:
      'Affirmations, journaling, and daily rituals, explained by the Stellar team at Camm Studios.',
    site: stellar.site,
    items: posts
      .sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime())
      .map((post) => ({
        title: post.data.title,
        url: `${stellar.site}/blog/${post.id}`,
        date: post.data.publishDate,
        summary: post.data.summary,
      })),
  });
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
