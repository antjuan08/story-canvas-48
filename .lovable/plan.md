## Add Invite button to TopBar

Place a new "Invite" button in `src/components/layout/TopBar.tsx`, immediately left of the account avatar dropdown (and left of the `TrialBanner`/mobile search cluster it sits next to).

### Behavior
Clicking opens a dropdown (using existing `DropdownMenu`) with share options:
- **Email** — opens `mailto:?subject=Join me on Storyou&body=<invite text + link>`
- **X / Twitter** — opens `https://twitter.com/intent/tweet?text=...&url=<invite link>` in new tab
- **LinkedIn** — opens `https://www.linkedin.com/sharing/share-offsite/?url=<invite link>` in new tab
- **Facebook** — opens `https://www.facebook.com/sharer/sharer.php?u=<invite link>` in new tab
- **Copy link** — copies invite URL to clipboard via `navigator.clipboard.writeText`, shows a `toast.success("Link copied")`

Invite link = `window.location.origin` (landing page). Invite copy: "I'm using Storyou to capture and share my stories — join me:".

### UI
- Desktop: pill-style ghost button with `UserPlus` lucide icon + "Invite" label, matching existing rounded/ghost styling in the header.
- Mobile (<md): icon-only button (same `UserPlus`), consistent with the existing mobile search button.
- Dropdown items use lucide icons: `Mail`, `Twitter`, `Linkedin`, `Facebook`, `Link2` (copy).

### Files
- `src/components/layout/TopBar.tsx` — add the Invite dropdown block between `TrialBanner`/mobile-search and the account `DropdownMenu`. No other files changed.
