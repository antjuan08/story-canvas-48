---
name: Brand Palette
description: Official brand colors and how/where each is applied across the app
type: design
---
Brand palette tokens (defined in `src/index.css`, exposed via Tailwind as `brand-*`):

- `--brand-anchor` `#0B0B0B` — Anchor Black. Authority, hero backgrounds, primary ink (foreground in light theme).
- `--brand-bone` `#F4EFE6` — Bone White. Light surfaces, editorial ground (background in light theme).
- `--brand-brass` `#B8893B` — Brass. Headlines, accents, the "8" mark, halo core. Used for cloud accents + rain drops.
- `--brand-aged-gold` `#7A5C1E` — Aged Gold. Secondary accent, weathered depth, gradient end, accent clouds.
- `--brand-sermon-red` `#A23B2D` — Sermon Red. CTAs, pull quotes, emphasis, destructive, halo mid, accent clouds.
- `--brand-smoke` `#6B6661` — Smoke Grey. Body text, dividers, captions.

Gradient tokens (`--gradient-start/mid/end`) flow Sermon Red → Brass → Aged Gold for hero gradients.
Halo (`--halo-core`/`--halo-mid`) is Brass → Sermon Red.

Cloud illustrations (`CloudsBackdrop`) tint ~3-4 clouds with brass/aged-gold/sermon-red while keeping the rest neutral so the accents feel editorial, not decorative.
