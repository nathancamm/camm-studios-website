# Artwork brief v5 — CAMM OS (cinematic spaceflight, no solarpunk)

Use your image generation capability (imagegen skill, built-in image_gen tool).
Generate SEVEN base images, then THREE loop-frame variants. Copy every file
into the exact workspace path given, overwriting existing files.

Shared art direction: CINEMATIC PHOTOREAL SPACEFLIGHT. Stills from a prestige
space film: deep clean blacks, precise machines, dramatic rim light, shallow
depth where it helps. Jewel colour against darkness: cobalt blue signal
lights, aurora teal, solar gold, violet nebulae. Quiet, exact, expensive.
NO solarpunk, NO cowboys, NO greenhouses, NO deserts, NO painterly canvas
texture. The site around these images is strict monochrome console UI, so
each image should read like a window out of the console.

Hard constraints for ALL images: no text, no letters, no numbers, no logos,
no watermarks, no user interfaces, no screens with content, no readable
faces. Landscape orientation, widest available size.

## Base images

1. `src/shared/assets/art/company-hero.png`
   A small, beautifully engineered satellite in low orbit above Earth's night
   side. City lights and a thin aurora arc below, star field above. The
   satellite is compact and precise, catching golden sunrise rim light on one
   edge, one small cobalt signal light blinking on its body. Vast dark space
   in the upper-left third for a headline.

2. `src/shared/assets/art/company-craft.png`
   Macro scene inside a dark clean room: a precision robotic arm performs
   micro-assembly on a palm-sized device held in a jig, under a single cool
   task light. Sparks of reflected light in dark metal, one cobalt indicator
   glowing. The feeling: enormous care applied to something very small.

3. `src/shared/assets/art/company-404.png`
   A tiny probe drifting alone in empty black space, slightly tumbling, its
   unspooled antenna trailing, one cobalt light still blinking. A distant
   pale planet far out of reach. Gently funny, very lonely, lots of empty
   space in the center.

4. `src/shared/assets/art/bronzed-hero.png`
   The sun observed from space: an enormous, detailed solar disc filling the
   right side, granular surface and prominence arcs, with a tiny observation
   probe silhouetted in transit. Gold and amber against deep black. Dark
   space at the upper left for copy.

5. `src/shared/assets/art/stellar-hero.png`
   Deep space seen through the open aperture ring of a great telescope: a
   violet-and-cobalt nebula with a sharp cluster of stars, the dark barrel
   edge framing the right side. Vast, hopeful, precise. Dark space at the
   upper left for copy.

6. `src/shared/assets/art/blog-uv.png`
   Macro photograph of a scientific UV sensor instrument: a domed quartz lens
   catching a shaft of hard sunlight that splits into a faint spectrum inside
   the glass, dark lab background, gold and cobalt reflections. Editorial,
   precise.

7. `src/shared/assets/art/blog-369.png`
   Inside a dark space-station cupola at night: an open blank paper notebook
   and a pen floating gently in zero gravity, lit by warm cabin light, with
   Earth's blue glow through the round window behind. Blank pages only.

## Loop frames (living hero animation)

For each of the three hero images, create ONE variant frame by EDITING the
base image you just generated (load it with view_image, then use edit mode).
Keep the composition and every major element pixel-identical, changing ONLY:
signal lights slightly brighter or dimmer, stars subtly varied, aurora or
nebula drifted a touch. The two frames cross-fade slowly on the site, so the
change must feel like the scene breathing.

- `src/shared/assets/art/company-hero-b.png`
- `src/shared/assets/art/bronzed-hero-b.png`
- `src/shared/assets/art/stellar-hero-b.png`

When all ten files are saved, run `ls -la src/shared/assets/art/` and report
dimensions with sips. Do not run any git commands.
