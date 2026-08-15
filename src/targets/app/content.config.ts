import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/shared/content/blog' }),
  schema: z.object({
    app: z.enum(['bronzed', 'stellar']),
    slug: z.string().min(1),
    title: z.string().min(10),
    summary: z.string().min(20),
    publicationDate: z.coerce.date(),
    updatedDate: z.coerce.date(),
    heroImage: z.enum(['blog-uv', 'blog-369']),
    alt: z.string().min(10),
    keywords: z.array(z.string()).min(1),
    sources: z.array(z.object({ label: z.string(), url: z.url() })),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
