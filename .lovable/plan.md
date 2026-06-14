# Plan

## 1. Mic → record → polish → save flow (PromptWorkspace)

Replace today's live dictation-into-textarea with a clean record/transcribe/refine flow.

- **Mic tap 1 — start recording**
  - Use existing `MediaRecorder` pattern (like `DictateButton.tsx` → `audio-ai` edge function) instead of in-browser `SpeechRecognition`, so audio is captured first and transcribed later.
  - Hide the textarea + Refine/Send row while recording.
  - Show a recording UI inside the cloud: pulsing red dot, elapsed time `mm:ss`, and a thin indeterminate progress bar (animated `bg-background/30` strip). No transcript text shown.
- **Mic tap 2 — stop**
  - Stop the recorder, show "Transcribing…" with spinner inside the cloud.
  - POST blob to `audio-ai` edge function (already exists) → get full transcript.
- **AI polish gate** (before it floats up to the cloud shelf)
  - Auto-call `refine-story` edge function on the transcript.
  - Swap cloud contents to a "Polish preview" card with: refined text in a read-only area, and two buttons — `Edit` (drops refined text back into the normal textarea so user can tweak) and `Send to cloud` (runs the existing save path).
  - User can also re-record from this screen (discard).
- **Typed input path** unchanged — still uses textarea + Refine button + Send.

## 2. AI-generated title on save

- Currently `handleSubmit` derives title from first sentence. Change so that:
  - When saving from the polish gate, use `refine-story`'s returned `title` (already returned, currently ignored).
  - When saving typed input that wasn't refined, call `refine-story` server-side just to get a title (cheap), or fall back to the first-sentence heuristic if that call fails.

## 3. Cloud shelf: clickable, 3–4 newest, rotating

- `CloudShelf` currently shows up to 8. Cap to `slice(0, 4)`.
- Render each chip as a `<Link to={`/stories?story=${id}`}>` (or `useNavigate` on click). Add hover/focus styles.
- On the Stories page, read `?story=<id>` from `useSearchParams` on mount; if present and the story exists, open `StoryEditorDialog` for it (clears the param afterwards). No change to the bubbles grid otherwise.
- New stories prepend; `slice(0, 4)` naturally rotates older ones out. Add `animate-cloud-pop` on the new entry (already present) and a fade-out on the one being dropped (simple CSS transition on opacity/scale keyed off id).

## 4. Stick-figure illustration strip on the homepage

- Add a full-width band above `SiteFooter` on `src/pages/Home.tsx` containing four stick-figure SVG illustrations spread end-to-end:
  1. Keynote speaker at a podium
  2. Podcast host at a mic
  3. Book library / stacked books
  4. Family reading together
- Build as inline React SVGs in a new `src/components/home/StickFigureStrip.tsx` so they inherit `currentColor` (works in both themes) and need no asset pipeline. Layout: `flex justify-between items-end` with subtle ground line; responsive (`gap-6`, scales down on mobile).

## Technical details

- **Files to edit**
  - `src/components/dashboard/PromptWorkspace.tsx` — new recording/polish state machine, drop `useDictation`, switch to `MediaRecorder` + `audio-ai` invoke; cap shelf to 4; chips become links.
  - `src/components/dashboard/PromptWorkspace.tsx` (`CloudShelf`) — clickable chips, fade-out transition.
  - `src/pages/tabs/Stories.tsx` — read `?story=` param, auto-open editor.
  - `src/pages/Home.tsx` — render `<StickFigureStrip />` above footer.
- **Files to create**
  - `src/components/home/StickFigureStrip.tsx` — four inline SVG stick-figure scenes.
- **No backend changes** — `audio-ai` (transcribe) and `refine-story` edge functions already exist and return `{ title, refined }`.
- **No DB migrations.**

## Out of scope (ask if you want it)

- Attachment button wiring (still a placeholder).
- Editing/regenerating the AI title after save.
