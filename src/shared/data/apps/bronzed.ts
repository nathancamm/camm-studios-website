import icon from '../../assets/product/bronzed-icon.png';
import screenshot from '../../assets/product/bronzed-screenshot.png';
import instrumentArt from '../../assets/art/crystal/bronzed-solar.webp';
import uvIndexArt from '../../assets/art/crystal/bronzed-uv.webp';
import cloudyDayArt from '../../assets/art/crystal/bronzed-cloud.webp';
import sunscreenArt from '../../assets/art/crystal/bronzed-spf.webp';
import type { AppDefinition } from '../app-definition';

const bronzed: AppDefinition = {
  target: 'bronzed',
  name: 'Bronzed',
  appStoreTitle: 'Bronzed — Tan Timer & UV Index',
  eyebrow: 'UV guidance and outdoor timer',
  tagline: 'Know the UV. Plan your time outside.',
  description:
    'Bronzed combines live UV, weather, your skin type, and SPF choice into practical guidance and a focused timer.',
  storeUrl: 'https://apps.apple.com/app/id6788585058',
  category: 'Weather and Health & Fitness',
  icon,
  screenshot,
  instrumentArt,
  guideArt: {
    'uv-index-explained': uvIndexArt,
    'cloudy-day-uv': cloudyDayArt,
    'sunscreen-spf-and-uv-index': sunscreenArt,
  },
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
  blogSummary:
    'A practical guide to the global UV scale, when sun protection matters, and why temperature can mislead you.',
  seoDescription:
    'Bronzed turns live UV, weather, skin type, and SPF into practical outdoor guidance and a focused timer.',
};

export default bronzed;
