# Design QA

Date: 2026-08-23  
State: production content, local static builds, no authentication  
Browser: Codex in-app browser

## Source truth

- Selected identity: `/var/folders/4n/swhyhbr94pj2sh_z29tggg5m0000gn/T/codex-clipboard-077397be-2426-4c60-919c-5501a4c89c4e.png` (1254 × 1254), confirmed by the user as the final glass robotic snake.
- Original snake anatomy reference: `/Users/nathan/Desktop/Business/Apps/logo.png` (409 × 384).
- Internal-tools composition reference: `/Users/nathan/Desktop/Screenshot 2026-08-23 at 3.56.02 pm.png` (1314 × 1752).
- Refined direction: keep the selected identity clear glass; render every other object as an abstract but physically coherent scientific instrument. Bronzed must center on a sun, Stellar on a star, all on a cool-white dot-matrix field.

## Evidence

Desktop viewport: 1440 × 1000 CSS pixels at DPR 1.

- Company hero: `/tmp/camm-browser-qa/company-desktop.png`
- Company systems: `/tmp/camm-browser-qa/company-systems-cards.png`
- Logo study, selected identity: `/tmp/camm-browser-qa/logo-study-desktop.png`
- Bronzed solar-dial hero: `/tmp/camm-browser-qa/bronzed-desktop.png`
- Stellar star-compass hero: `/tmp/camm-browser-qa/stellar-desktop-final.png`
- Bronzed guide index: `/tmp/camm-browser-qa/bronzed-blog.png`
- Stellar guide index: `/tmp/camm-browser-qa/stellar-blog.png`

Mobile viewport: 390 × 844 CSS pixels at DPR 1.

- Company hero: `/tmp/camm-browser-qa/company-mobile.png`
- Open company navigation: `/tmp/camm-browser-qa/company-mobile-menu.png`
- Logo study, selected identity: `/tmp/camm-browser-qa/logo-study-mobile.png`
- Bronzed hero: `/tmp/camm-browser-qa/bronzed-mobile.png`
- Stellar hero: `/tmp/camm-browser-qa/stellar-mobile.png`

Focused comparison inputs:

- Selected source logo beside the rendered logo-study implementation: `/tmp/camm-browser-qa/logo-source-comparison.png`
- Complete internal-system, Bronzed, and Stellar artwork family: `/tmp/camm-blender/asset-family-contact.png`
- Bronzed Blender render: `/tmp/camm-blender/bronzed-solar-dial.png`
- Stellar Blender render: `/tmp/camm-blender/stellar-star-compass.png`

## Comparison history

1. The supplied Vertebra Lock artwork was promoted unchanged to the live company identity, favicon, navigation, company social image, hero poster, and selected logo-study state.
2. The first Stellar browser render made the star too close to the white stage. The central body material was darkened to cool graphite, the GLB was regenerated and reopened in a fresh Blender process, the Stellar build was rebuilt, and the browser render was repeated.
3. The refined Stellar render now has an unmistakable eight-point star silhouette while retaining the white, silver, graphite, and pale-lilac product language.
4. Bronzed was rebuilt around a supported ceramic sun dial with twelve joined rays, an axle, bearings, a pointer, and an orange calibration orbit.
5. The four Greek systems and six guide images were reviewed together. Their rings, rails, pivots, columns, collars, and bases keep every abstraction physically legible without forcing the company logo's glass material onto the rest of the site.

## Fidelity audit

- Identity: the final website uses the exact selected glass robotic snake. The C-shaped body, squared coil, optical eye, articulated joints, open right side, and lower tail match the supplied source.
- Typography and spacing: the existing premium light system remains intact. Desktop two-column heroes and card grids retain their measured rhythm; all reviewed mobile layouts collapse without overflow.
- Color: company surfaces remain cool white, pale blue-grey, silver, and graphite. Orange appears only in Bronzed calibration geometry; pale lilac appears only in Stellar calibration geometry.
- Physical logic: Artemis is a supported signal bow; Atlas is a weight-bearing orbit stack; Morpheus is a ribbon carried through rail-mounted rollers; Chronos is a bearing-mounted cadence gimbal. Bronzed guide objects use sun emitters, filters, rails, and shields; Stellar guide objects use mounted star cores, rods, resonance plates, orbits, and pivots.
- Asset quality: system and guide artwork is 1200 × 800 WebP, product artwork is 1024 × 1024 WebP, and all three hero stages load authored GLB models. Superseded artwork and model files were removed from the source asset set.

## Interaction and runtime checks

- Company, Bronzed, and Stellar hero canvases reached `is-rendered` with the new model URLs.
- Two Stellar captures taken 1.2 seconds apart were not byte-identical, confirming the restrained Three.js motion loop is active.
- Both Blender files were reopened in fresh background processes. Reports found no missing external files; Bronzed contains 45 model meshes and Stellar contains 36 model meshes.
- The mobile menu opened with `aria-expanded="true"` and displayed all company destinations.
- Six mobile routes and four desktop routes reported zero horizontal overflow and zero broken images.
- Browser runtime logs were empty after the company, logo study, Bronzed, Stellar, and guide-index checks.
- `npm run check:all` completed with zero errors, warnings, or hints. `npm test` rebuilt all three static sites and passed all 19 contract tests.

## Findings

No unresolved P0, P1, or P2 visual defects remain in the reviewed states.

## Final result

passed
