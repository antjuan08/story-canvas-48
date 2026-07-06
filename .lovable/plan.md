## Make Landing the home page + add Start Your Story CTA

### Routing (`src/App.tsx`)
- `/` → `<Landing />` (public, no auth required)
- `/auth` → `<Home />` (the current sign-in / sign-up screen)
- Keep `/landing` as a redirect to `/` for back-compat
- Signed-in users visiting `/` stay on Landing (no auto-redirect). The header CTA takes them into the app.

### Sign-up entry points
- **Header** (`src/pages/Landing.tsx`): add a primary **"Start your story"** button on the right side of the top nav. For signed-out users it links to `/auth`; for signed-in users it links to `/dashboard`.
- **Hero banner**: ensure a prominent **"Start your story"** button appears in the hero section (add if not already the primary CTA), linking to `/auth` (or `/dashboard` when signed in).

### Logo behavior
- `TopBar` (in-app header, `src/components/layout/TopBar.tsx`): logo mark + "Storyou" wordmark link to `/` (landing).
- `Landing` header: logo + wordmark link to `/`.
- `Home` (`src/pages/Home.tsx`): the brand mark in the top-left becomes a link to `/`.

### Home page auth redirect
- `Home.tsx` currently reads `?next=` and defaults to `/dashboard`. Keep that; only change is it now lives at `/auth` instead of `/`.

### Files touched
- `src/App.tsx` — swap `/` and `/auth` routes, add `/landing` redirect
- `src/pages/Landing.tsx` — header "Start your story" button, logo → `/`, hero CTA points to `/auth` or `/dashboard` based on session
- `src/pages/Home.tsx` — wrap brand mark in `Link to="/"`
- `src/components/layout/TopBar.tsx` — logo/wordmark link to `/` (landing) instead of `/dashboard`

No backend, styling, or Invite-button changes.