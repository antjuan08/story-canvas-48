# Auth Page Halo Redesign

Reimagine `/auth` to match the Superpower reference: a dark, cinematic page with a large warm radial halo glowing behind a portrait image, with the sign-in card floating to the side.

## Layout

Split the screen into two zones on desktop, stacked on mobile:

```text
+---------------------------------------------------+
|                                  .  HALO  .       |
|   StoryYou                      .         .       |
|   Your stories. Your stage.    .  PERSON  .       |
|                                 .         .       |
|   [ Auth card: Google/Apple,     .       .        |
|     email + password,             . . . .         |
|     sign in / sign up tabs ]                      |
|                                                   |
|   Trusted · Private · Yours                       |
+---------------------------------------------------+
```

- Background: near-black (`hsl(0 0% 4%)`-ish) with a single huge radial-gradient "sun" halo in warm amber tones (configurable via CSS variables).
- Portrait: a silhouetted person image sits centered inside the halo on the right half. Edges feather into the dark background. On mobile the halo + image become a top hero band above the card.
- Auth card: keeps current glass styling but lighter-weight — transparent dark glass over the halo, rounded-2xl, soft border, all current functionality intact (Google/Apple OAuth, email tabs, validation).
- Small stat row at the bottom mirroring the reference ("Private by default", "Yours forever", "Made for storytellers") — purely decorative.

## Image injection

The portrait is swappable in one place:

- Add `src/assets/auth-portrait.jpg` as the default (generated with imagegen: silhouetted person facing the halo, warm rim light, transparent-feeling edges).
- In `Auth.tsx` import it as `authPortrait` and render in an `<img>` with `object-cover`, masked by a radial CSS mask so the edges blend into the halo.
- Document at the top of the file: "Replace `src/assets/auth-portrait.jpg` to swap the hero image."

## Halo implementation

Pure CSS, no extra deps:

- A absolutely-positioned `div` behind the image using `background: radial-gradient(circle at center, hsl(var(--halo-core)) 0%, hsl(var(--halo-mid)) 35%, transparent 70%)`.
- Add halo tokens to `src/index.css` under `:root` and `.dark` (warm amber default: core `38 100% 62%`, mid `28 90% 45%`).
- Soft `blur-3xl` + `mix-blend-screen` on a second layer for extra glow bloom.
- Subtle slow pulse animation (8s ease-in-out) on the halo opacity, respecting `prefers-reduced-motion`.

## Files

- edit `src/pages/Auth.tsx` — new two-column layout, halo + portrait, keep all auth logic untouched
- edit `src/index.css` — add `--halo-core`, `--halo-mid`, `.halo-glow` utility, pulse keyframes
- add `src/assets/auth-portrait.jpg` — generated silhouette portrait against warm halo (replaceable)

No backend, routing, or auth-logic changes.
