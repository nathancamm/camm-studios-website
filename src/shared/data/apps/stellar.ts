import icon from '../../assets/product/stellar-icon.png';
import screenshot from '../../assets/product/stellar-screenshot.png';
import type { AppDefinition } from '../app-definition';

const stellar: AppDefinition = {
  target: 'stellar',
  name: 'Stellar',
  appStoreTitle: 'Stellar — Mantra & Ritual',
  eyebrow: 'Affirmations and daily reflection',
  tagline: 'A daily ritual you can return to.',
  description:
    'Stellar brings affirmations, 369 journaling, vision boards, and gentle progress cues into one private place.',
  storeUrl: 'https://apps.apple.com/app/id6759896200',
  category: 'Lifestyle',
  icon,
  screenshot,
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
  blogSummary:
    'A grounded way to use three daily writing moments for attention, reflection, and steady habit building.',
  seoDescription:
    'Stellar is a private daily ritual for affirmations, the 369 method, vision boards, and consistent reflection.',
};

export default stellar;
