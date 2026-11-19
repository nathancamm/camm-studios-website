# Camm Studios Website

One Astro repository builds three independent static sites:

- `www.cammstudios.com` for the company
- `bronzed.cammstudios.com` for Bronzed
- `stellar.cammstudios.com` for Stellar

## Local development

```bash
npm install
npm run dev
npm run dev:bronzed
npm run dev:stellar
```

The development commands use Astro's default port. Run one target at a time or pass a different port.

## Design

All three sites share a video background, Helvetica typography, and liquid-glass panels and footers. Astro keeps page content static; React handles video controls and the Motion footer. Tailwind CSS v4 supplies the shared utility styles without resetting existing page typography.

The supplied CloudFront video and Helvetica font are loaded remotely. Reduced-motion visitors receive a still background, playback can be paused, and unavailable media falls back to a dark background. Decorative artwork uses an SVG alpha filter to remove its white matte without modifying source files.

## Verification

```bash
npm run check:all
npm test
```

`npm test` builds all targets and verifies routes, canonical URLs, product links, and permanent legacy redirects.

## Bronzed on Cloudflare

`bronzed.cammstudios.com` is an assets-only Cloudflare Worker named `bronzed-site`, configured in `cloudflare.config.ts`. The `cammstudios.com` zone is on Cloudflare, and the Worker's custom domain creates the DNS record.

```bash
cf auth login          # once per machine
npm run deploy:bronzed # build:bronzed, then cf deploy ./dist/bronzed
```

The app links to its privacy policy and terms on the company site (`www.cammstudios.com/apps/bronzed/`). Until those documents move to the subdomain, the generated `_redirects` file sends `/privacy` and `/terms` there with a 302, and the sitemap leaves them out. When the company site moves to this repository, delete `src/targets/app/pages/[redirects].ts` first, or those rules will loop with the legacy redirects in `vercel.json`.

## Vercel projects

The company and Stellar sites deploy as Vercel projects from this repository. Bronzed deploys to Cloudflare (above). Configure each project with its own environment value, build command, and output directory.

| Project | `SITE_TARGET` | Build command | Output directory |
| --- | --- | --- | --- |
| Company | `company` | `npm run build:company` | `dist/company` |
| Stellar | `stellar` | `npm run build:stellar` | `dist/stellar` |

Assign `www.cammstudios.com` and `stellar.cammstudios.com` to their matching projects. Keep `cammstudios.com` on the company project so its host redirect and legacy legal routes resolve directly.

## Public copy

Use verified public facts about Camm Studios and its products.
Do not invent team size, process, company status, or corporate framing.
Keep internal tools and research methods out of public pages.
Recheck product claims against the matching app before publishing.
