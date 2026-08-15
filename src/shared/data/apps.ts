/**
 * Product facts for every Camm Studios app.
 * Verified against the live App Store listings on 2026-08-16.
 */

export interface AppDefinition {
  /** short key, also the SITE_TARGET value */
  id: 'bronzed' | 'stellar';
  name: string;
  storeName: string;
  tagline: string;
  oneLiner: string;
  appStoreUrl: string;
  appStoreId: string;
  site: string;
  genres: string[];
  price: string;
  minimumOs: string;
  released: string;
  accent: 'orange' | 'cobalt';
}

export const bronzed: AppDefinition = {
  id: 'bronzed',
  name: 'Bronzed',
  storeName: 'Bronzed - Tan Timer & UV Index',
  tagline: 'Tan smart, never burn.',
  oneLiner:
    'It reads the live UV index and your skin type, then gives you one number: how long you can stay out. A tan, no burn.',
  appStoreUrl: 'https://apps.apple.com/app/id6788585058',
  appStoreId: '6788585058',
  site: 'https://bronzed.cammstudios.com',
  genres: ['Weather', 'Health & Fitness'],
  price: 'Free',
  minimumOs: '18.0',
  released: '2026-08-05',
  accent: 'orange',
};

export const stellar: AppDefinition = {
  id: 'stellar',
  name: 'Stellar',
  storeName: 'Stellar - Daily Affirmations',
  tagline: 'Speak it. Write it. See it.',
  oneLiner:
    'Affirmations, a guided 369 journal, and a vision board. Five quiet minutes a day, no feed attached.',
  appStoreUrl: 'https://apps.apple.com/app/id6759896200',
  appStoreId: '6759896200',
  site: 'https://stellar.cammstudios.com',
  genres: ['Lifestyle', 'Health & Fitness'],
  price: 'Free',
  minimumOs: '18.6',
  released: '2026-03-10',
  accent: 'cobalt',
};

export const apps: AppDefinition[] = [bronzed, stellar];

export const company = {
  name: 'Camm Studios',
  site: 'https://www.cammstudios.com',
  email: 'info@cammstudios.com',
  tagline: 'Small apps. Clear purpose. Built to get better.',
} as const;
