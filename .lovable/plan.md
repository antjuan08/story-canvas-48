## Changes

### Home / Landing (`/`)
- Shrink the auth card to ~50% size: reduce max-width from `max-w-md` to `max-w-xs`, tighten padding (`p-5`), smaller heading (`text-2xl`), compact inputs/buttons.
- **Invert the clouds globally on Home**: background becomes off-white (cream `hsl(48, 56%, 95%)`), clouds rendered in black with white/cream stroke. Tree-swing scene re-tinted for the light background.
- Hero text and brand mark recolored for light background (ink text).

### Dashboard (post-login home, `/dashboard`)
- Keep current dark background everywhere EXCEPT Home — confirmed by request ("keep background black, except homepage").
- No structural change beyond ensuring Dashboard remains the post-login landing (already is).

### Stories tab (`/dashboard/stories`)
- Text color: force `text-foreground` → explicit black/ink so titles and snippets read against pastel bubbles.
- **Dynamic bubble sizing**: compute size from count — more stories ⇒ smaller bubbles. Size = `clamp(96px, 520/√count, 224px)` applied via inline style; replaces fixed `BUBBLE_SIZES`.
- **Bubble hover animation**: gentle bobbing float loop on each bubble; on hover scale ~1.08, lift, soft shadow, and faster bob — like floating soap bubbles. Pure CSS keyframes + per-bubble animation-delay.
- **White cloud illustration** added behind the Stories grid (reuse `CloudsBackdrop` with a white-cloud variant prop, or inline a white-fill version).
- **Categories**: predefined set — Family, Friendship, Business, Hard Times, Love, Travel, Childhood, Other. Category filter chips at top of Stories. Auto-categorize new/updated stories via a lightweight edge function (`categorize-story`) using `google/gemini-2.5-flash-lite` that returns one category + tags; result stored in existing `stories.category` and `stories.tags` columns. Backfill button to categorize unlabeled stories.
- **Tags & keywords**: surface tag chips on each bubble/list row; tag filter alongside category filter; tags editable in the StoryEditorDialog (already has `tags` column).

### Tab pages — bigger illustrations
- **Keynote**: move `illustration-keynote.png` to the LEFT of the builder card, render at ~`w-[420px]` (was small/decorative).
- **Podcast**: enlarge `illustration-podcast.png` to ~`w-[420px]`, placed left of the feed/wizard.
- **Book**: enlarge `illustration-book.png` similarly, left of the open-book panel.
- Use two-column layout `lg:grid-cols-[420px_1fr]`; illustrations stack above on mobile.
- Reimagined stays as-is (not mentioned).

### Files to touch
- `src/pages/Home.tsx` — shrink card, invert color scheme.
- `src/components/visuals/CloudsBackdrop.tsx` — add `variant: "light" | "dark"` (black clouds on cream vs white clouds on dark).
- `src/pages/tabs/Stories.tsx` — dynamic sizing, hover bubble animation, black text, category/tag filters, white-cloud backdrop.
- `src/pages/tabs/Keynote.tsx`, `Podcast.tsx`, `Book.tsx` — bigger left-side illustrations.
- New edge function `supabase/functions/categorize-story/index.ts` + call site after story save.
- No schema migration needed (`stories.category` and `stories.tags` already exist).

### Out of scope (per user)
- No copy change to "StoryYou Labs, Inc." footer text.
- No changes to Reimagined tab.

Confirm and I'll build it.
