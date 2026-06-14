# Plan: Home tab + 5 distinct content pages with AI builders

## 1. Navigation — add Home pill
- Update the `TABS` array in `src/components/dashboard/PromptWorkspace.tsx` (and any other shared nav) to prepend `Home` as the first pill, routing to `/`.
- Active state matches the current route.

## 2. Stories — bubble grid with view toggle
File: `src/pages/tabs/Stories.tsx` (rewrite, drop PromptWorkspace wrapper).
- Header: serif title + search input + view toggle (Bubbles / List).
- **Bubbles view**: circular cards (varying soft pastel fills on cream bg), 100-char preview snippet, category dot, hover lifts.
- **List view**: clean row layout — title, snippet, date, tag chips.
- Data: existing `useStories` hook. Click → opens existing `StoryEditorDialog`.
- Filter: search by title/body; tag chips along the top.

## 3. Keynote — questionnaire wizard
File: `src/pages/tabs/Keynote.tsx` (rewrite).
- Two-pane layout: left = saved keynotes list (with thumbnail/list toggle); right = "Build a keynote" CTA → opens a multi-step questionnaire dialog:
  1. Audience  2. Core message  3. Tone  4. Desired length  5. Stories to draw from (multi-select from vault)
- On submit → calls edge function `keynote-builder` → AI returns structured talking points (title + 5–8 bullet points + opening/closing lines).
- Result persisted in new `keynotes` table; displayed in a clean outline card.

## 4. Podcast — + button wizard
File: `src/pages/tabs/Podcast.tsx` (rewrite).
- Magazine-style layout: feed of generated shows with cover blocks. Floating `+` FAB bottom-right.
- `+` → wizard: show name, episode topic, format (interview/solo/narrative), length, **stories to pull from** (multi-select).
- Submits to edge function `podcast-builder` → AI returns: episode title, intro script, segment outline (3–5 segments with talking points + story references), outro.
- Persisted in new `podcasts` table.
- Same thumbnail/list toggle as Stories/Keynote.

## 5. Book — chapter spreads
File: `src/pages/tabs/Book.tsx` (rewrite).
- Open-book layout: two-column page spread (paper-cream pages with subtle shadow). Sidebar = chapter list. Each "chapter" = a saved story styled as a book page.
- Reading-mode typography: Fraunces serif, drop cap on first letter, line-height generous.
- No AI builder this round; pulls from `stories`.

## 6. Reimagined — collage / remix gallery
File: `src/pages/tabs/Reimagined.tsx` (rewrite).
- Broken-grid / collage layout: AI-generated alternate framings of existing stories (rendered as cards with the "what if" reimagined snippet).
- Single "Reimagine a story" button → pick a story → edge function `reimagine-story` returns 3 alternate retellings (different POV/genre/era).
- Visually: rotated polaroid-style cards on cream bg, hand-drawn dividers.

## 7. Backend
- **Migration**: create `keynotes`, `podcasts`, `reimagined_stories` tables. Each has `id`, `user_id`, `title`, `payload jsonb`, `created_at`, RLS scoped to `auth.uid()`, GRANTs for `authenticated` + `service_role`.
- **Edge functions** (Lovable AI Gateway, model `google/gemini-2.5-flash`):
  - `keynote-builder` — input: questionnaire + story IDs → structured keynote JSON.
  - `podcast-builder` — input: questionnaire + story IDs → structured podcast outline JSON.
  - `reimagine-story` — input: story_id + angle → 3 alternate versions.
- All functions fetch referenced stories server-side via service-role client, include them in the prompt, return JSON.

## 8. Shared bits
- New `ViewToggle` component (`src/components/ui/view-toggle.tsx`) — pill toggle for thumbnail/list.
- Reuse Flow aesthetic (cream/Fraunces/Inter) across all pages, but each page gets a distinct layout primitive (bubbles, two-pane wizard, magazine feed, book spread, collage).

## Technical notes
- All AI calls use `google/gemini-2.5-flash` via Lovable AI Gateway (no user key needed).
- New tables follow the public-schema GRANT contract.
- The existing Dashboard stays as the central prompt workspace; the 5 tabs become destinations with their own designs (no longer thin wrappers around PromptWorkspace).
- Question copy / illustrations stay monochrome on tab pages to match the new Home aesthetic.

Scope is large — ~6 new files, 5 rewrites, 1 migration, 3 edge functions. Approve to proceed and I'll build it in one pass.