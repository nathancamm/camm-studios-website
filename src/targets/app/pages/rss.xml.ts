import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { getCurrentApp } from '@shared/data/apps';

export const GET: APIRoute = async (context) => {
  const app = getCurrentApp();
  const posts = await getCollection('blog', ({ data }) => data.app === app.target && !data.draft);
  return rss({
    title: `${app.name} Journal`,
    description: app.blogSummary,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: post.data.publicationDate,
      link: `/blog/${post.data.slug}/`,
    })),
  });
};
