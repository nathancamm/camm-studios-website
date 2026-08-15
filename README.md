# Camm Studios websites

One Astro repository builds three static sites:

| Target | Host | Content |
|---|---|---|
| `company` | www.cammstudios.com | Studio homepage, process, support, legal |
| `bronzed` | bronzed.cammstudios.com | Bronzed product site, blog, support, legal |
| `stellar` | stellar.cammstudios.com | Stellar product site, blog, support, legal |

## Architecture

- `SITE_TARGET` selects the site at build time. See `astro.config.mjs`.
- Each target has its own page tree in `src/sites/<target>/pages/`.
- Each target has its own public dir in `public/<target>/`.
- Shared components, styles, data, and assets live in `src/shared/`.
- Blog posts live in `content/blog/<app>/` as Markdown with a validated schema.
- Product facts live in `src/shared/data/apps.ts`. Verify them against the live
  App Store listings before you change copy.

## Commands

```sh
npm install
npm run dev              # company site on localhost
npm run dev:bronzed      # bronzed site
npm run dev:stellar      # stellar site
npm run build:all        # build all three into dist/<target>/
npm run check            # astro type check
node scripts/gen-assets.mjs   # regenerate favicons and og images
```

## Deployment

Three Vercel projects point at this repository. Each project sets one
environment variable:

1. `cammstudios` — `SITE_TARGET=company`, domains `www.cammstudios.com` and `cammstudios.com`.
2. `bronzed` — `SITE_TARGET=bronzed`, domain `bronzed.cammstudios.com`.
3. `stellar` — `SITE_TARGET=stellar`, domain `stellar.cammstudios.com`.

`vercel.json` holds the build command, clean URLs, and the permanent redirects
for the legacy legal URLs. The host condition keeps the apex redirect scoped to
`cammstudios.com`.

## Artwork

Atmospheric images were generated with GPT Image through the Codex CLI. The
brief lives in `docs/art-brief.md`. Regenerate an image with the same brief if
a composition needs work. Never generate fake app interfaces. App screenshots
must come from the real App Store listings.
