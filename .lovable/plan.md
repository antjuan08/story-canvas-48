
## 1. Fix framing (content shifted left / text cut off)

Root cause: `pl-18` and `w-18` in `AppLayout.tsx` and `Sidebar.tsx` are not valid Tailwind classes (Tailwind has no `18` spacing by default), so the sidebar collapses to `0` width and main content has no left padding, but the fixed sidebar still overlays the left edge — pushing things visually off.

- In `tailwind.config.ts`, add `spacing: { 18: '4.5rem' }` in `theme.extend`.
- Add a max-width container in `AppLayout` main: `max-w-[1600px] mx-auto` with responsive padding `px-4 md:px-6 lg:px-8`.
- Ensure `min-w-0` / `overflow-x-hidden` on the wrapper to prevent horizontal overflow on narrow viewports.

## 2. Apply Syncra brand (from uploaded reference)

Dark-first, glossy purple/magenta → coral gradient orb aesthetic.

- Update `src/index.css` tokens:
  - Default to dark theme palette (deep black `--background: 240 10% 4%`).
  - Primary gradient: `--gradient-start: 270 90% 55%` (vivid purple) → `--gradient-end: 12 95% 60%` (coral/red).
  - Accent glow: violet `280 95% 65%`.
  - Glass cards: `rgba(255,255,255,0.04)` over dark with subtle violet border.
- Replace `bg-gradient-primary` definition with the purple→coral diagonal.
- Add a reusable `.orb-glow` utility (radial purple→coral with blur) for hero accents.
- Apply to: sidebar logo, "New" button, KPI accent rings, Record mic button.

## 3. Dark Mode tab / toggle

- Add a dedicated **Appearance** section in `Settings` page with Light / Dark / System radio cards (using existing theme toggle logic).
- Persist choice to `localStorage` and apply `.dark` class on `<html>` at app boot (small `useTheme` hook in `src/hooks/use-theme.ts`).
- Keep the existing TopBar sun/moon button as a quick toggle wired to the same hook.

## 4. CMS Media Library

Reshape `/library` into a media CMS for images and audio.

- Tabs: **Images** | **Audio** | **All**.
- Grid of media cards with thumbnail (waveform placeholder for audio), filename, size, date, tag chips.
- Upload zone (drag-drop) using a hidden `<input type="file" accept="image/*,audio/*" multiple>`.
- Client-side state via Zustand store `src/stores/mediaStore.ts`: items kept in memory + `localStorage` (object URLs for preview). No backend yet — flag a follow-up to wire Lovable Cloud storage when ready.
- Item actions: preview (dialog with `<img>` or `<audio controls>`), rename, delete, copy link.

## 5. AI Record page

Rebuild `/record`:

- Big centered Syncra-style mic orb (purple→coral radial gradient, pulsing while recording).
- Uses `MediaRecorder` API → produces a `Blob` (audio/webm).
- On stop: auto-append to a **Recordings playlist** below (list of cards with `<audio controls>`, duration, timestamp, title editable).
- Recordings persisted in Zustand store `src/stores/recordingsStore.ts` (+ localStorage; blobs kept as object URLs for the session, with a note that persistence across reloads needs Cloud storage).
- Each recording card has buttons:
  - **Transcribe** — stub now (placeholder text) with a clear TODO to wire Lovable AI Gateway speech-to-text when Cloud is enabled.
  - **Rewrite as Story** — takes transcript, calls AI to produce a storytelling-mode narrative; opens a modal showing the rewritten story with **Export** (download `.md`/`.txt`) and **Send to Library** actions.

Because transcription + rewrite need server-side AI, this step is stubbed in the plan with mock output, and I'll prompt to enable **Lovable Cloud** before wiring real calls.

## 6. Files touched

```text
edit   tailwind.config.ts                (spacing.18, brand colors)
edit   src/index.css                     (Syncra dark palette, orb utility)
edit   src/components/layout/AppLayout.tsx   (fix padding, max-width)
edit   src/components/layout/Sidebar.tsx     (w-18 → valid class, brand)
edit   src/components/layout/TopBar.tsx      (use theme hook)
new    src/hooks/use-theme.ts
new    src/stores/mediaStore.ts
new    src/stores/recordingsStore.ts
rewrite src/pages/Library.tsx            (CMS media library)
rewrite src/pages/Record.tsx             (recorder + playlist + transcript)
edit   src/pages/Settings.tsx            (Appearance section)
new    src/components/media/MediaCard.tsx
new    src/components/media/UploadZone.tsx
new    src/components/record/MicOrb.tsx
new    src/components/record/RecordingCard.tsx
new    src/components/record/StoryDialog.tsx
```

## 7. Open question

Transcription + AI story rewrite require a backend (Lovable Cloud + AI Gateway). I'll stub them with mock output in this pass and ask to enable Cloud right after, so the buttons become real. OK to proceed this way?
