## 1. Universal overflow (•••) menu on every tab card

Add the same ellipsis menu to every item on **Stories, Keynote, Podcast, Book, Reimagined**. Each menu shows three actions:

- **Send to Canva** — see §2
- **Export** — downloads native format:
  - Stories → `.txt` / `.md`
  - Keynote → `.pptx` (and a `.pdf` companion)
  - Podcast → `.mp3` (audio) + `.txt` (script)
  - Book → `.pdf`
  - Reimagined → `.mp4` (or `.png` cover if video isn't rendered yet)
- **Delete** — confirm dialog, then removes the row and its storage files.

Implementation: one shared `<ItemOverflowMenu kind="keynote|podcast|book|story|reimagined" item={...} onDelete={…}/>` component built on the existing `DropdownMenu` and `AlertDialog` primitives, dropped into each tab's card grid (matches the pattern already used on the Stories page header).

## 2. Canva integration — two-track

You picked "both," so we ship the quick path now and wire the real one once Canva credentials are in.

**Track A — Quick export + open Canva (works today, no setup):**
- Clicking *Send to Canva* generates the appropriate file (same exporter used by the Export action) and uploads it to the existing `story-media` bucket.
- A toast pops with **"Open Canva"** which launches `https://www.canva.com/design?create&type=presentation` (or `document`/`video` depending on the item) in a new tab and copies the asset URL to clipboard so you paste-import in Canva.

**Track B — Canva Connect API (real "Send to Canva"):**
- New edge function `canva-send` that POSTs to Canva's `/v1/imports` endpoint to create a real design in your account.
- Requires a one-time setup: register a Canva integration at canva.com/developers → get **Client ID + Client Secret + Redirect URL**, then we store them as `CANVA_CLIENT_ID` / `CANVA_CLIENT_SECRET` secrets.
- Per-user OAuth: new `canva_tokens` table (user_id, access_token, refresh_token, expires_at) with RLS, plus `canva-oauth-start` / `canva-oauth-callback` functions. First time you hit *Send to Canva* you'll be sent through Canva's auth.
- Once tokens exist, *Send to Canva* uses Track B silently; otherwise falls back to Track A.

I'll build Track A end-to-end this round and scaffold Track B (table + function stubs + a *"Connect Canva"* button in Settings) so it's ready to flip on as soon as you paste credentials.

## 3. Reimagine wizard — photo / video / audio uploads

Replace the current minimal wizard with a richer step where you can attach references that drive the render.

UI additions inside `ReimagineWizard`:
- Three drop slots: **Photo** (jpg/png), **Video clip** (mp4/mov, ≤ 60s), **Audio** (mp3/wav/m4a, ≤ 5min) — built on the existing `MediaSlot` pattern from `StoryEditorDialog`.
- Files upload to the existing `story-media` bucket under `reimagine/{user_id}/{uuid}.{ext}`.
- A toggle: **"Use my photo as the opening frame"** (image-to-video mode).
- A toggle: **"Use my audio as the voiceover"** (overrides any TTS).

Data:
- Extend `reimagined_stories` with `ref_image_url`, `ref_video_url`, `ref_audio_url`, `use_image_as_first_frame`, `use_uploaded_audio` (all nullable). Migration includes the standard GRANTs; RLS unchanged.

Render path inside `reimagine-story` edge function:
- If `ref_image_url` is present and `use_image_as_first_frame` is true → call **Replicate** with an image-to-video model (e.g. `stability-ai/stable-video-diffusion` or `kling-ai`) using that image as the starting frame; this requires linking the Replicate connector (already enabled, just needs `standard_connectors--connect`).
- If `ref_video_url` is present → pass its URL into the prompt and attach it as a reference clip (model-dependent; many video models accept a "style reference" URL).
- If `ref_audio_url` is present and `use_uploaded_audio` is true → after the silent video renders, the function muxes the upload over the clip using ffmpeg (already available in edge runtime via WASM) or stores both URLs and the player overlays the audio. Default to the player-overlay approach to keep the function fast; we can move to server-side mux later.
- All three URLs are saved on the row regardless, so we keep "attached as references" for any future re-render.

## Technical details

**Files / changes**
- New: `src/components/shared/ItemOverflowMenu.tsx`, `src/lib/exporters.ts` (per-kind file builders), `src/lib/canva.ts` (open-canva helper + Track B client).
- New: `supabase/functions/canva-send/index.ts`, `supabase/functions/canva-oauth-start/index.ts`, `supabase/functions/canva-oauth-callback/index.ts`.
- Edit: `src/pages/tabs/{Stories,Keynote,Podcast,Book,Reimagined}.tsx` — drop the overflow into each card.
- Edit: `src/pages/tabs/Reimagined.tsx` (`ReimagineWizard`) — add upload slots + toggles.
- Edit: `supabase/functions/reimagine-story/index.ts` — accept new fields, branch to image-to-video on Replicate when a photo is attached.
- Migration: add columns to `reimagined_stories`; create `canva_tokens` with RLS + GRANTs.
- Secrets requested (after you confirm): `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`.
- Connector to link: **Replicate** (for image-to-video).

**What I'll ask for at build time**
1. Confirm the Replicate connection so image-to-video can run.
2. Canva Client ID + Secret when you're ready for Track B (Track A works without them).
