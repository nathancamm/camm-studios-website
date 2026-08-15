import type { ImageMetadata } from 'astro';
import bronzedArt from '../assets/art/bronzed-system.png';
import stellarArt from '../assets/art/stellar-system.png';
import bronzedIcon from '../assets/product/bronzed-icon.png';
import bronzedScreenshot from '../assets/product/bronzed-screenshot.png';
import stellarIcon from '../assets/product/stellar-icon.png';
import stellarScreenshot from '../assets/product/stellar-screenshot.png';

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
  version: string;
  icon: ImageMetadata;
  screenshot: ImageMetadata;
  artwork: ImageMetadata;
  artworkAlt: string;
  accent: string;
  themeClass: string;
  features: Array<{ title: string; body: string }>;
  steps: Array<{ number: string; title: string; body: string }>;
  faqs: Array<{ question: string; answer: string }>;
  blogSlug: string;
  blogTitle: string;
  blogSummary: string;
  blogDate: string;
  seoDescription: string;
}

export const apps: Record<AppTarget, AppDefinition> = {
  bronzed: {
    target: 'bronzed',
    name: 'Bronzed',
    appStoreTitle: 'Bronzed — Tan Timer & UV Index',
    eyebrow: 'Sun companion for iPhone',
    tagline: 'Tan smart, never burn.',
    description:
      'Turn live UV conditions, your skin type, cloud cover, and SPF into a clear outdoor time estimate.',
    storeUrl: 'https://apps.apple.com/app/id6788585058',
    category: 'Weather and Health & Fitness',
    version: '1.0.2',
    icon: bronzedIcon,
    screenshot: bronzedScreenshot,
    artwork: bronzedArt,
    artworkAlt:
      'An orange solar signal passing through five cobalt measurement bands into a circular timer.',
    accent: '#e4571a',
    themeClass: 'theme-bronzed',
    features: [
      {
        title: 'Live conditions, made useful',
        body: 'See local UV, weather, cloud cover, and a practical outlook before you step outside.',
      },
      {
        title: 'A time estimate shaped around you',
        body: 'Bronzed considers your skin type, current UV, cloud cover, and chosen SPF. The result is guidance, not a guarantee.',
      },
      {
        title: 'A timer that stays with you',
        body: 'Run a session from your Lock Screen, Dynamic Island, or Apple Watch without losing track of time.',
      },
      {
        title: 'Progress without guesswork',
        body: 'Keep session history, progress photos, streaks, SPF guidance, and vitamin D estimates in one place.',
      },
    ],
    steps: [
      { number: '01', title: 'Set your profile', body: 'Choose your skin type, current shade, and usual SPF.' },
      { number: '02', title: 'Check the signal', body: 'Bronzed reads live UV and local weather conditions.' },
      { number: '03', title: 'Use the estimate', body: 'Start the timer and keep following official sun protection advice.' },
    ],
    faqs: [
      {
        question: 'Can Bronzed prevent sunburn?',
        answer:
          'No. No app can prevent sunburn. Bronzed provides estimates and general guidance, not medical advice. UV can change quickly, and every person responds differently.',
      },
      {
        question: 'Where does the UV data come from?',
        answer: 'Bronzed uses Apple WeatherKit for current UV, temperature, conditions, and forecasts.',
      },
      {
        question: 'Does Bronzed need my location?',
        answer:
          'Location access is optional. It supports local weather and UV. You can choose a location manually instead.',
      },
      {
        question: 'How do subscriptions work?',
        answer:
          'Available plans and local prices appear in the app. Apple handles billing, renewals, cancellations, and refunds.',
      },
    ],
    blogSlug: 'uv-index-explained',
    blogTitle: 'UV Index explained: what each level means for your time outdoors.',
    blogSummary:
      'A practical guide to the global UV scale, when sun protection matters, and why temperature can mislead you.',
    blogDate: '2026-08-16',
    seoDescription:
      'Bronzed turns live UV, weather, skin type, and SPF into practical outdoor guidance and a focused timer.',
  },
  stellar: {
    target: 'stellar',
    name: 'Stellar',
    appStoreTitle: 'Stellar — Mantra & Ritual',
    eyebrow: 'Daily ritual for iPhone',
    tagline: 'Give your intentions a place to return to.',
    description:
      'Build a steady daily ritual with affirmations, a 369 journal, vision boards, and simple progress cues.',
    storeUrl: 'https://apps.apple.com/app/id6759896200',
    category: 'Lifestyle',
    version: '1.2',
    icon: stellarIcon,
    screenshot: stellarScreenshot,
    artwork: stellarArt,
    artworkAlt:
      'A cobalt path moving through three abstract phases marked by clusters of three, six, and nine orange points.',
    accent: '#5b67df',
    themeClass: 'theme-stellar',
    features: [
      {
        title: 'Words for the moment you are in',
        body: 'Browse more than 800 affirmations or write your own. Save the ones that feel useful today.',
      },
      {
        title: 'A clear 369 rhythm',
        body: 'Return to one intention in the morning, afternoon, and evening through a guided writing ritual.',
      },
      {
        title: 'Keep the bigger picture visible',
        body: 'Shape a private vision board with your own images, goals, and reminders.',
      },
      {
        title: 'Consistency without pressure',
        body: 'Gentle reminders and streaks help you return. Missing a day does not erase the work.',
      },
    ],
    steps: [
      { number: '03', title: 'Morning', body: 'Write your chosen intention three times and set a direction.' },
      { number: '06', title: 'Afternoon', body: 'Return for six repetitions and notice what changed.' },
      { number: '09', title: 'Evening', body: 'Close with nine repetitions and a short reflection.' },
    ],
    faqs: [
      {
        question: 'Does the 369 method guarantee results?',
        answer:
          'No. Stellar presents it as a reflection and habit building practice. It cannot guarantee personal, financial, health, or relationship outcomes.',
      },
      {
        question: 'How many affirmations are included?',
        answer: 'Stellar includes more than 800 affirmations, with support for your own custom affirmations.',
      },
      {
        question: 'Is my journal private?',
        answer:
          'Your journal text, custom affirmations, focus text, and vision board content stay on your device. See the Privacy Policy for analytics and attribution details.',
      },
      {
        question: 'Which languages are supported?',
        answer: 'Stellar is localized for 33 languages.',
      },
    ],
    blogSlug: '369-method-daily-ritual',
    blogTitle: 'How to use the 369 manifestation method as a daily ritual.',
    blogSummary:
      'A grounded way to use three daily writing moments for attention, reflection, and steady habit building.',
    blogDate: '2026-08-16',
    seoDescription:
      'Stellar is a private daily ritual for affirmations, the 369 method, vision boards, and consistent reflection.',
  },
};

export function getCurrentApp(): AppDefinition {
  const target = process.env.SITE_TARGET;
  if (target !== 'bronzed' && target !== 'stellar') {
    throw new Error('App pages require SITE_TARGET=bronzed or SITE_TARGET=stellar.');
  }
  return apps[target];
}
