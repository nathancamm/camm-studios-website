# Camm Studios Website

Static website for [Camm Studios](https://cammstudios.com) iOS apps.

## Pages

- **/** — Home (app showcase)
- **/support.html** — Contact, subscription management, FAQs
- **/privacy-policy.html** — General privacy policy
- **/terms-of-service.html** — General terms of service
- **/apps/manifest/** — Manifest app landing page
- **/apps/manifest/privacy.html** — Manifest privacy policy
- **/apps/manifest/terms.html** — Manifest terms of service

## Adding a New App

1. Create a new folder: `apps/your-app-name/`
2. Copy `apps/manifest/` as a template
3. Update content, meta tags, and structured data
4. Add an app card to `index.html`
5. Add URLs to `sitemap.xml`

## Deploy

Static HTML/CSS — no build step required.

**Vercel:** Connect this repo, set root directory to `/`, deploy.
**Netlify:** Connect this repo, publish directory `.`, deploy.

## Local Development

```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

## Customization Checklist

- [ ] Replace `support@cammstudios.com` with real email
- [ ] Replace `https://cammstudios.com` in meta tags + sitemap with actual domain
- [ ] Add App Store link to Manifest landing page
- [ ] Add app screenshot to Manifest hero
- [ ] Add app icon / favicon
