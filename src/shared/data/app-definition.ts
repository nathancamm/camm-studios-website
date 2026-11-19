import type { ImageMetadata } from 'astro';

export type AppTarget = 'bronzed' | 'stellar';

export interface AppDefinition {
  target: AppTarget;
  name: string;
  appStoreTitle: string;
  eyebrow: string;
  tagline: string;
  description: string;
  storeUrl: string;
  category: string;
  icon: ImageMetadata;
  screenshot: ImageMetadata;
  instrumentArt: ImageMetadata;
  guideArt: Record<string, ImageMetadata>;
  accent: string;
  themeClass: string;
  features: Array<{ title: string; body: string }>;
  steps: Array<{ number: string; title: string; body: string }>;
  faqs: Array<{ question: string; answer: string }>;
  blogSummary: string;
  seoDescription: string;
}
