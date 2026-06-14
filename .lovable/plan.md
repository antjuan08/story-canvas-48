# Plan

## 1. Tab highlight bug (Home + Stories both lighting up)
In `src/components/nav/TabNav.tsx`, active state is `active === t.label || location.pathname === t.path`. When a page passes `active="Stories"` but lands on a route whose pathname is `/` or shares a prefix, Home also matches. Fix by relying on a single source of truth:
- Remove the `active` prop entirely.
- Compute `isActive` from `location.pathname === t.path` only (exact match).
- Update all call sites (`Stories.tsx`, `Keynote.tsx`, `Podcast.tsx`, `Book.tsx`, `Reimagined.tsx`, `Dashboard.tsx`) to drop the `active` prop.

## 2. Stories bubble text centering
In `src/pages/tabs/Stories.tsx`, bubble button uses `flex flex-col justify-end` which pins text to the bottom of the circle. Change to `justify-center items-center text-center`, drop the absolute-positioned category chip, and stack: category (tiny caps) → title (serif) → snippet → tag chips, all centered. Keep the small dot indicator.

## 3. Login box: nudge right, make ~1.5× bigger but not wide
In `src/pages/Home.tsx`:
- Auth column: change `justify-self-center lg:justify-self-start` → `lg:justify-self-end lg:pr-8` so the card sits to the right of the left column (matching the screenshot).
- Card width: `max-w-[300px]` → `max-w-[360px]` (about 1.5× area via taller padding, not wider).
- Increase inner spacing: padding `p-5` → `p-7`, heading `text-xl` → `text-2xl`, inputs `h-8 text-xs` → `h-10 text-sm`, buttons `h-8 text-xs` → `h-10 text-sm`, label `text-[10px]` → `text-xs`.
- Keep the right-side hero headline and tree-swing illustration where they are.

## 4. Theme switcher (Light / Dark / System)
A `useTheme` hook already exists (`src/hooks/use-theme.ts`) with `applyTheme` and persistence. Wire it up:
- Call `initTheme()` once in `src/main.tsx`.
- Add a compact Sun/Moon/Monitor segmented toggle to `src/components/layout/TopBar.tsx` (right side, before the avatar) using the existing hook.
- Ensure the Dashboard's inline cream overrides only apply in light mode (wrap the inline `style` vars behind `theme !== 'dark'`, or move them under a `.light` selector) so dark mode actually goes dark on the home page.
- Settings page (`src/pages/Settings.tsx`) already has theme cards — leave as-is, just remove the "Syncra purple glow" copy to match the neutral palette.

## 5. Mobile / tablet optimization
- **TopBar / nav (mobile)**: in `TopBar.tsx`, hide the inline tab row under `md:` and show a hamburger button that opens a `Sheet` (shadcn) listing the same `NAV_TABS`. Tablet (`md`+) keeps the pill nav.
- **Home/Dashboard prompt position on phone**: in `src/pages/Dashboard.tsx`, reduce top padding on `<md` (e.g. `pt-4 md:pt-16`) and move the central prompt workspace above the cloud shelf so the text box sits near the top of the viewport on phones. Stack the tab pill below the prompt on mobile.
- **Login page on phone** (`Home.tsx`): single column under `lg:`, card `max-w-[340px]` centered with `pt-10` so it appears near the top; hide the tree-swing SVG under `md:` (already partly done) and shrink the headline.
- **Tabs pages (Keynote/Podcast/Book/Reimagined/Stories)**: ensure the illustration + card grid switches to single column under `md:` and the search/filter row wraps (`flex-wrap gap-2`).
- Verify at 390×844 (iPhone), 768 (tablet), 1280+ (desktop).

## Technical notes
- No schema or backend changes.
- No new dependencies; `Sheet` and theme hook already exist.
- Files touched: `src/components/nav/TabNav.tsx`, `src/components/layout/TopBar.tsx`, `src/pages/Home.tsx`, `src/pages/Dashboard.tsx`, `src/pages/tabs/Stories.tsx` (+ small `active` prop removals in the other tab pages), `src/main.tsx`, `src/pages/Settings.tsx`.
