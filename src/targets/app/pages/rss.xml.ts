import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import app from '@app-data';

export const GET: APIRoute = async (context) => {
  const posts = (await getCollection('blog', ({ data }) => data.app === app.target && !data.draft))
    .sort((a, b) => b.data.publicationDate.valueOf() - a.data.publicationDate.valueOf());
  return rss({
    title: `${app.name} Guides`,
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
