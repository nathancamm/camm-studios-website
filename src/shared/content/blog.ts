import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * One blog collection per app site. Markdown lives at the repo root in
 * content/blog/<app>/ so every site build reads the same source of truth.
 */
export function blogCollection(app: 'bronzed' | 'stellar') {
  return defineCollection({
    loader: glob({ pattern: '**/*.md', base: `./content/blog/${app}` }),
    schema: ({ image }) =>
      z.object({
        title: z.string().max(90),
        summary: z.string().max(240),
        publishDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        hero: image(),
        heroAlt: z.string(),
        keywords: z.array(z.string()).min(1),
        sources: z
          .array(z.object({ title: z.string(), url: z.string().url() }))
          .default([]),
        draft: z.boolean().default(false),
      }),
  });
}
