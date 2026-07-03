# Landing page nav update

Scope: `src/pages/Landing.tsx` only (top sticky nav). No other files, no route changes.

## What changes

Replace the current three plain text links ("Product", "Explore", "For teams") plus the "Support ↗" link with **four hover/click dropdown tabs**, each revealing its subtabs on hover (desktop) and tap (mobile via a small collapsible).

### Tab structure

- **Story** → Story Cloud, Signature Story, Storyboard, Enterprise Stories
- **Stage** → Keynote, Feedback Coach
- **Studio** → Podcast, Reimagine Studio
- **Support** → StoryU, Tutorials, Courses, Case Studies

All subtab links point to `/` for now (placeholder), so the marketing nav renders and behaves correctly without introducing broken routes. Easy to wire to real destinations later.

## Design & behavior

- Keep existing sticky nav container, wordmark, and "Get started" pill button unchanged.
- Tab label styling matches the current nav text (Inter, `text-anchor/70`, hover `text-anchor`), with a subtle chevron (`ChevronDown` from lucide-react, already used in project).
- Dropdown panel: `rounded-2xl`, `border-anchor/10`, `bg-brand-bone`, soft shadow, ~220px wide, opens on hover for desktop and on click for touch. Items are Inter, small caps-free, `py-2 px-3`, hover `bg-anchor/[0.04]`.
- Reveal uses a simple CSS transition (opacity + translate-y-1), no new deps.
- Mobile (`< lg`): nav collapses into an accordion-style list under a hamburger toggle (reuse the existing pattern already in Landing if present, otherwise a lightweight `useState` disclosure). Each parent tab expands to show its subtabs indented.
- Accessible: parent is a `<button>` with `aria-expanded` and `aria-haspopup="menu"`; subtabs are `<Link>` with clear focus rings. Escape closes the open panel; click-outside closes via a `useEffect` listener.

## Technical notes

- Define a local `NAV` array at the top of the file:
  ```ts
  const NAV = [
    { label: "Story",   items: ["Story Cloud", "Signature Story", "Storyboard", "Enterprise Stories"] },
    { label: "Stage",   items: ["Keynote", "Feedback Coach"] },
    { label: "Studio",  items: ["Podcast", "Reimagine Studio"] },
    { label: "Support", items: ["StoryU", "Tutorials", "Courses", "Case Studies"] },
  ];
  ```
- Small `NavDropdown` component inline in `Landing.tsx` (no new files) with `useState` for open, `onMouseEnter`/`onMouseLeave` for hover, and click toggle for touch.
- Import `ChevronDown` from `lucide-react`.
- No changes to hero, feature grid, testimonials, footer, routes, or auth.

## Out of scope

- Creating real destination routes for the subtabs.
- Any change to `/` (Home) or authenticated app nav (`TopBar`).
- Copy/typography/theme changes elsewhere on the landing page.
