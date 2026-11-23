import type { AppDefinition } from './app-definition';

export const sunburnCalculatorPath = '/sunburn-calculator/';

/** Bronzed's free web tool, linked from its navigation. Stellar has none. */
export function appToolLink(app: AppDefinition) {
  return app.target === 'bronzed' ? [{ href: sunburnCalculatorPath, label: 'Calculator' }] : [];
}

/** Primary navigation for app subpages. The home page adds its own section anchors. */
export function appNavLinks(app: AppDefinition) {
  return [
    { href: '/', label: app.name },
    ...appToolLink(app),
    { href: '/blog', label: 'Guides' },
    { href: '/support', label: 'Support' },
  ];
}
