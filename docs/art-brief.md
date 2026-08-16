# Artwork brief v4 — Camm Studios website (colour + loop frames)

Use your image generation capability (imagegen skill, built-in image_gen tool).
Generate SEVEN base images, then THREE loop-frame variants. Copy every file
into the exact workspace path given, overwriting existing files.

Shared art direction: painterly retro-futurist "space renaissance cowboy
solarpunk", in RICH CINEMATIC COLOUR. Think renaissance landscape painting
crossed with a classic sci-fi paperback cover. Deep cobalt and teal night
skies, gold and amber lamplight, soft violet nebulae, green glass domes.
Avoid a dominant orange wash; colour should feel jewel-like and varied. Soft
film grain, painterly texture, vast quiet compositions. The site around these
images is strict monochrome, so each image should glow like a stained-glass
window in a gray gallery.

Hard constraints for ALL images: no text, no letters, no numbers, no logos, no
watermarks, no user interfaces, no screens, no readable faces. Landscape
orientation, widest available size.

## Base images

1. `src/shared/assets/art/company-hero.png`
   A vast twilight desert prairie from a low ridge. A single tiny rider on
   horseback far in the distance, heading toward warm-lit green glass
   greenhouse domes. A colossal ringed planet rising, first stars out, teal
   dusk fading to gold at the horizon. Keep the upper-left third of the sky
   quiet for a headline.

2. `src/shared/assets/art/company-craft.png`
   Inside a glass dome at night, a small friendly robot gardener prunes a
   tiny glowing tree in a brass pot. Cobalt starry sky through the glass,
   warm gold lamplight, green foliage in shadow. Intimate and quiet.

3. `src/shared/assets/art/company-404.png`
   A small round robot in a cowboy hat alone in a moonlit desert beside a
   leaning blank signpost, scratching its head. Violet-blue night, one gold
   shooting star, lots of empty sky in the center.

4. `src/shared/assets/art/bronzed-hero.png`
   An enormous low sun over a calm sea, ringed by faint etched brass
   measurement arcs, like the sun is an instrument dial. Amber and rose sky,
   deep teal water, glass domes glowing on a distant headland. Space at the
   upper left for copy.

5. `src/shared/assets/art/stellar-hero.png`
   A deep cobalt night sky where a constellation of bright stars is joined by
   thin gold lines, above a dark mesa with a small brass telescope and one
   warm-lit tent. Violet milky way, vast and hopeful. Space at the upper left
   for copy.

6. `src/shared/assets/art/blog-uv.png`
   A painterly still life of brass solar instruments — heliograph, sundial
   disc, a small orange-glass sphere — on a stone ledge in hard midday light,
   deep blue sky behind. Renaissance engraving mood, sci-fi edge.

7. `src/shared/assets/art/blog-369.png`
   An open blank journal and brass pen on a small wooden desk floating in a
   cobalt starfield, a lantern with a warm flame, a tiny ringed planet in the
   distance. Blank pages only.

## Loop frames (for a living, breathing hero animation)

For each of the three hero images, create ONE variant frame by EDITING the
base image you just generated (load it with view_image, then use edit mode).
The variant must keep the composition, palette, and every major element
pixel-identical, changing ONLY:

- clouds drifted very slightly,
- star or lamp brightness subtly different,
- water or grass texture subtly shifted.

The two frames will be slowly cross-faded in a loop on the website, so the
change must be gentle, like a scene breathing. Save the variants as:

- `src/shared/assets/art/company-hero-b.png`
- `src/shared/assets/art/bronzed-hero-b.png`
- `src/shared/assets/art/stellar-hero-b.png`

When all ten files are saved, run `ls -la src/shared/assets/art/` and report
dimensions with sips. Do not run any git commands.
