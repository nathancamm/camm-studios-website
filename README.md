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

## Verification

```bash
npm run check:all
npm test
```

`npm test` builds all targets and verifies routes, canonical URLs, product links, and permanent legacy redirects.

## Vercel projects

Create three Vercel projects from this repository. Configure each project with its own environment value, build command, and output directory.

| Project | `SITE_TARGET` | Build command | Output directory |
| --- | --- | --- | --- |
| Company | `company` | `npm run build:company` | `dist/company` |
| Bronzed | `bronzed` | `npm run build:bronzed` | `dist/bronzed` |
| Stellar | `stellar` | `npm run build:stellar` | `dist/stellar` |

Assign `www.cammstudios.com`, `bronzed.cammstudios.com`, and `stellar.cammstudios.com` to their matching projects. Keep `cammstudios.com` on the company project so its host redirect and legacy legal routes resolve directly.
