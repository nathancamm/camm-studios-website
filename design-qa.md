# Design QA

Date: 2026-08-23  
State: production content, local static builds, no authentication  
Browser: Codex in-app browser

## Source truth

- Current Camm Studios snake mark: `/Users/nathan/Desktop/Business/Apps/logo.png` (409 × 384)
- Internal-tools composition reference: `/Users/nathan/Desktop/Screenshot 2026-08-23 at 3.56.02 pm.png` (1314 × 1752)
- Required direction: cool white light theme, dot-matrix depth, colorless glass/crystal identity, robotic detail, and source-faithful C-shaped snake anatomy.

## Evidence

Desktop viewport: 1440 × 1000 CSS pixels at DPR 1.

- Company hero: `/tmp/camm-site-qa/company-hero-desktop-v4.png`
- Company systems, first pair: `/tmp/camm-site-qa/company-systems-desktop-v2.png`
- Company systems, second pair: `/tmp/camm-site-qa/company-systems-bottom-desktop.png`
- Company products: `/tmp/camm-site-qa/company-apps-desktop.png`
- Logo study, recommended direction: `/tmp/camm-site-qa/logo-study-desktop-top-v2.png`
- Logo study, final pair: `/tmp/camm-site-qa/logo-study-desktop-bottom-v2.png`
- Bronzed hero: `/tmp/camm-site-qa/bronzed-hero-desktop.png`
- Bronzed product detail: `/tmp/camm-site-qa/bronzed-features-desktop.png`
- Bronzed guide index: `/tmp/camm-site-qa/bronzed-blog-desktop.png`
- Stellar hero: `/tmp/camm-site-qa/stellar-hero-desktop.png`
- Stellar product detail: `/tmp/camm-site-qa/stellar-features-desktop.png`
- Stellar guide index: `/tmp/camm-site-qa/stellar-blog-desktop.png`

Mobile viewport: 390 × 844 CSS pixels at DPR 1.

- Company hero and 3D object: `/tmp/camm-site-qa/company-hero-mobile.png`, `/tmp/camm-site-qa/company-scene-mobile.png`
- Open mobile navigation: `/tmp/camm-site-qa/company-menu-mobile.png`
- Logo study and recommended concept: `/tmp/camm-site-qa/logo-study-mobile.png`, `/tmp/camm-site-qa/logo-study-stage-mobile.png`
- Bronzed hero and 3D object: `/tmp/camm-site-qa/bronzed-hero-mobile.png`, `/tmp/camm-site-qa/bronzed-scene-mobile.png`
- Stellar hero and 3D object: `/tmp/camm-site-qa/stellar-hero-mobile.png`, `/tmp/camm-site-qa/stellar-scene-mobile.png`
- Bronzed guide journey: `/tmp/camm-site-qa/bronzed-blog-mobile.png`, `/tmp/camm-site-qa/bronzed-article-mobile-settled.png`

Focused comparison inputs:

- Source logo beside rendered Three.js serpent: `/tmp/camm-site-qa/source-vs-hero-snake-v2.png`
- Source internal-tools section beside the light implementation: `/tmp/camm-site-qa/source-vs-systems.png`
- Source logo plus all five new concepts: `/tmp/camm-site-qa/source-plus-five-logo-grid.png`

## Comparison history

1. The first browser render cropped the serpent at the stage edges, which obscured the source silhouette. This was a P1 visual issue.
2. The model fit was reduced from 4.35 to 3.05, the company build was regenerated, and the browser comparison was repeated.
3. The corrected render keeps the squared top and bottom coil, left backbone, middle shelf, upper-right head and circular eye, lower-right tail, and open right side visible in one frame.
4. The logo-study images initially read as white square files placed on top of the stage. Multiplicative compositing was added, rebuilt, and reviewed again so the crystal forms integrate into the cool dot-matrix field.

## Fidelity audit

- Typography: headline scale, compact technical labels, sentence casing, and weight hierarchy remain consistent across company, app, and editorial templates. No clipped or orphaned primary headings were found after animations settled.
- Spacing: desktop two-column heroes and card grids preserve the intended measured rhythm. Mobile layouts collapse without horizontal overflow at 390 pixels.
- Color: all company identity surfaces remain neutral graphite, silver, white, and cool blue-grey. Product-specific orange and violet accents are restrained to Bronzed and Stellar contexts.
- Image quality: five logo options load at 1024 × 1024; system and guide artwork is authored at 1200 × 800; product artwork is 1024 × 1024; all three hero scenes load authored GLB models rather than procedural placeholder geometry.
- Copy: company operating-model language stays separate from app conversion copy. Each app retains three distinct search-oriented guides, canonical metadata, open-graph artwork, and BlogPosting structured data.

## Interaction and runtime checks

- Company, Bronzed, and Stellar hero canvases reached `is-rendered` and exposed the expected model URLs.
- Two company hero captures taken 1.1 seconds apart produced an SSIM score of 0.998636, confirming the restrained live motion loop changes the rendered frame.
- The mobile menu opened with `aria-expanded="true"`, displayed all three company destinations, then closed with `aria-expanded="false"`.
- A Bronzed guide card navigated to `/blog/cloudy-day-uv/`; the final article state, canonical URL, open-graph image, BlogPosting schema, and breadcrumb schema were present.
- Desktop and mobile checks reported zero horizontal overflow and no console warnings or errors on the reviewed pages.

## Findings

No unresolved P0, P1, or P2 visual defects remain in the reviewed states.

## Final result

passed
