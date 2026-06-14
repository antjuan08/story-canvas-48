
# Plan: Unified Home + Themed Tabs + AI Video Reimagine

## 1. Delete the standalone Auth page
- Remove `/auth` route and `src/pages/Auth.tsx`.
- `ProtectedRoute` redirects unauthenticated users to `/` (the new Home) instead of `/auth`.

## 2. Home page (`/`) becomes the auth + landing surface
Rewrite `src/pages/Home.tsx`:
- Keep the animated black-and-white cloud background + tree-on-tire-swing illustration.
- Center card with two modes: **Sign up** (default, "Get started") and **Log in** (toggle link).
  - Email + password, Google OAuth button.
  - On success → navigate to `/dashboard`.
- Footer nav (Product, Stories, Keynotes, Company, Contact, Careers) is REMOVED from the Home top/hero and moves into the new global `SiteFooter` (below).

## 3. Global `SiteFooter` shown after login
- New `src/components/layout/SiteFooter.tsx` with columns: Product, Stories, Keynotes, Company, Contact, Careers.
- Render inside `AppLayout` (so it appears on every protected page) under `<main>`.
- Not rendered on `/` (Home) or while logged out.

## 4. Dashboard background = moving clouds
- `src/pages/Dashboard.tsx` gets the same animated cloud backdrop as Home (extract `<CloudsBackdrop />` from Home into `src/components/visuals/CloudsBackdrop.tsx` and reuse).
- The existing prompt workspace sits on top of the clouds.

## 5. Per-tab illustrations (monochrome stick-figure "cloud" art)
Generate four PNG illustrations via imagegen (matches Home's hand-drawn black/white aesthetic, transparent background):
- `keynote-illustration.png` — stick figure on a stage giving a talk, small clouds floating above.
- `podcast-illustration.png` — two stick figures in chairs facing each other with mics, clouds above (placed bottom-left of Podcast page).
- `book-illustration.png` — stick-figure student at a library desk, clouds above.
- (Reimagined gets its own — see §8.)

Each tab page gets a hero band featuring its illustration with the Flow-style heading.

## 6. Podcast page — Show Builder templates
- Replace single "+" with a `+` button that opens a **template picker** dialog first:
  - Educational
  - Encouraging
  - Entertaining
  - Conversational
- Picking a template seeds the existing podcast wizard (tone/format prefilled) and then runs the existing `podcast-builder` edge function.
- No DB schema changes (template stored in `podcasts.payload.template`).

## 7. Book page — Add-a-Book templates
- Add a `+ Add book` button → template picker dialog:
  - Fiction
  - Non-fiction
  - Self-help
  - Autobiography
  - Instructional
  - Educational
- Picking a template opens a sub-window (book metadata: title, premise, chapters target) → saves a new row.
- New table `books` (id, user_id, title, template, premise, payload jsonb, created_at) with RLS + GRANTs.
- Book page lists saved books alongside the existing open-book spread.

## 8. Reimagined tab — AI video generation
- Replace the current 3-text-variations flow with a **"Bring a story to life as a 30–60s video"** flow.
- UI: pick a story → choose duration (30s or 60s) → "Reimagine" button.
- Backend: rewrite `supabase/functions/reimagine-story/index.ts`:
  1. Call Lovable AI (`google/gemini-2.5-flash`) to turn the story into a tight video prompt + cover-image prompt.
  2. Call Lovable AI image model `google/gemini-2.5-flash-image` ("Nano Banana") to generate a cover frame and store in Supabase Storage.
  3. Note: Lovable AI Gateway does not currently expose a text-to-video model. The edge function returns the cover image + video prompt and marks `status='ready_for_video'`. The UI shows the cover with a "Generating video…" placeholder and a clear message that video rendering is queued.
  - Confirm with user before building: should we (a) ship cover-image + script now and wire real video later, or (b) hold this tab until a video provider is connected (e.g., a Veo/Runway/Pika connector)? Default = (a).
- Extend `reimagined_stories` with `cover_url text`, `video_url text`, `status text default 'pending'`, `duration_seconds int`.
- Add Supabase Storage bucket `reimagined` (public read).
- Reimagined page hero illustration: stick figure watching a cloud morph into a film reel.

## 9. Routing/cleanup
- `/auth` → redirect to `/`.
- TabNav unchanged (Home pill already routes to `/`).

## Technical notes
- All AI calls go through Lovable AI Gateway; no user keys.
- New tables (`books`, plus columns on `reimagined_stories`) get RLS + explicit GRANTs to `authenticated` and `service_role`.
- New storage bucket created via migration.
- Visual language stays monochrome cream/ink with Fraunces + Inter.

## Files (high level)
- **Delete**: `src/pages/Auth.tsx`
- **Rewrite**: `src/pages/Home.tsx`, `src/pages/tabs/Reimagined.tsx`, `supabase/functions/reimagine-story/index.ts`
- **Edit**: `src/App.tsx`, `src/components/layout/AppLayout.tsx`, `src/components/auth/ProtectedRoute.tsx`, `src/pages/Dashboard.tsx`, `src/pages/tabs/Keynote.tsx`, `src/pages/tabs/Podcast.tsx`, `src/pages/tabs/Book.tsx`
- **Create**: `src/components/layout/SiteFooter.tsx`, `src/components/visuals/CloudsBackdrop.tsx`, 4 illustration PNGs in `src/assets/`, migration for `books` + reimagined columns + storage bucket.

## One question before I build
Reimagined video generation — Lovable AI Gateway has image models (Nano Banana) but no text-to-video model right now. Pick one:
- **A (recommended)**: Ship now with an AI-generated cover image + video script; the actual MP4 stays a "coming soon" placeholder until we connect a video provider.
- **B**: Skip the video flow for now and leave Reimagined as the 3-text-variations it is today.
- **C**: You connect a video provider (e.g., Runway/Veo via API key) and I'll wire it.
