## 1. Reimagined video player

- Install `react-player` (lightweight, handles mp4/HLS/blob URLs).
- Create `src/components/reimagined/ReimaginedPlayer.tsx`: rounded card with `<ReactPlayer>`, custom controls (play/pause, scrub, time, volume, fullscreen, download), poster from `cover_url`, loading + error states.
- In `src/pages/tabs/Reimagined.tsx`: replace the current `<video>`/preview area with `<ReimaginedPlayer src={video_url} poster={cover_url} title={…} />`. Also use it inside any "open" dialog where a reimagined story is viewed.

## 2. Polish / Rewrite buttons next to the Mic

In `src/components/dashboard/PromptWorkspace.tsx`, in the icon row that currently holds Mic / Paperclip:

- Add two pill buttons right next to the mic:
  - `Polish` (Sparkles icon) — calls existing `polish` edge function (already used elsewhere) on the current draft text and replaces it.
  - `Rewrite` (Pencil/RotateCcw icon) — calls the polish function with a "rewrite/restructure" mode flag and replaces text.
- Both buttons:
  - Disabled when textarea is empty or while recording.
  - Show inline `Loader2` spinner while running.
  - Toast on success/error.
  - Same behavior also fires on import (paste of >200 chars or file import) via an "Auto-polish on import" toggle stored in `localStorage` and shown as a small switch under the buttons row.

## 3. Cloud rain illustration on theme inversion

- In `src/components/visuals/CloudsBackdrop.tsx` (or wherever the homepage clouds render), pick the rightmost cloud and attach a child `<RainBurst />` component.
- New `src/components/visuals/RainBurst.tsx`: SVG with 6–10 small droplets, color = `currentColor`, animated falling via Tailwind keyframes (`animate-rain-drop` with staggered `animation-delay`).
- Listen for theme changes (`useTheme()` from next-themes already in project) — when `theme` changes, set `playing=true` for ~1.5s. Color: white drops in dark mode, near-black drops in light mode.
- Add keyframes `rain-drop` (translateY 0→40px, opacity 1→0) to `tailwind.config.ts`.

## 4. Keynote "Feedback" (speech coaching)

On `src/pages/tabs/Keynote.tsx`, add a primary action button labeled **Feedback** (mic icon) on each keynote card and in the keynote detail view.

- Opens `FeedbackDialog`:
  - Records audio via `MediaRecorder` (reuse pattern from PromptWorkspace mic).
  - On stop, uploads to `recordings` bucket and calls a new edge function `speech-feedback` (Lovable AI, `google/gemini-2.5-flash`) that transcribes + scores: pacing, clarity, filler words, energy, structure (1–10 each), plus written coaching notes.
  - Displays scorecard + suggestions; "Save to keynote" attaches the feedback JSON to the keynote row.
- Migration: add `feedback jsonb` column to `keynotes` table (nullable). Standard GRANTs unchanged (existing table grants apply).
- New edge function: `supabase/functions/speech-feedback/index.ts` (verify_jwt true).

## 5. Testimonials tab in footer

- New page `src/pages/Testimonials.tsx`: list of user testimonials with avatar, name, quote, star rating; "Add yours" button opens a dialog that inserts into a new `testimonials` table.
- Migration: `testimonials (id, user_id, name, title, quote, rating, created_at)` with RLS:
  - `SELECT` public to anon+authenticated.
  - `INSERT` authenticated where `user_id = auth.uid()`.
  - `UPDATE/DELETE` own rows.
  - Standard GRANTs (`anon` SELECT, `authenticated` SELECT/INSERT/UPDATE/DELETE, `service_role` ALL).
- Add `/testimonials` route in `src/App.tsx`.
- Footer: add `<Footer>` to the dashboard layout if not present, with links including **Testimonials**. (Existing `SiteFooter` if present — extend; otherwise create `src/components/layout/SiteFooter.tsx` and mount it in `src/pages/Dashboard.tsx`.)

## Files

- **New**: `src/components/reimagined/ReimaginedPlayer.tsx`, `src/components/visuals/RainBurst.tsx`, `src/components/keynote/FeedbackDialog.tsx`, `src/pages/Testimonials.tsx`, `src/components/layout/SiteFooter.tsx`, `supabase/functions/speech-feedback/index.ts`
- **Edit**: `src/components/dashboard/PromptWorkspace.tsx`, `src/pages/tabs/Reimagined.tsx`, `src/pages/tabs/Keynote.tsx`, `src/components/visuals/CloudsBackdrop.tsx`, `src/pages/Dashboard.tsx`, `src/App.tsx`, `tailwind.config.ts`
- **Migration**: add `keynotes.feedback`, create `testimonials` + RLS + GRANTs
- **Deps**: `react-player`

## Open question

For the Polish vs Rewrite buttons — should **Rewrite** fully restructure the story (change wording/order, keep meaning) while **Polish** only fixes grammar/flow? I'll default to that distinction unless you say otherwise.
