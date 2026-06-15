# Stories page: collapsible filters + particle-graph view

Two scoped changes on `src/pages/tabs/Stories.tsx` (plus one new component). No data/business-logic changes.

## 1. Collapse Categories & Tags into toggle popovers

Today both filter rows render every chip inline. Move them into compact dropdowns next to **Auto-organize**.

- Replace the two inline chip rows with two `Popover` triggers in the toolbar:
  - **Categories** button → popover containing the existing category chips. Label shows active category (e.g. `Categories · Family`) with a small `×` to clear when not `All`.
  - **Tags** button → popover with all tag chips, searchable input on top if >12 tags. Label shows count (e.g. `Tags · 1`) when a tag is active.
- Selection behavior is unchanged (single category, single active tag).
- Place order in the toolbar: `Categories` · `Tags` · `Auto-organize` · search · view toggle · overflow menu.
- On small screens both buttons wrap below the title; popovers stay anchored.

## 2. New "Graph" view — particles in a cloud

Add a third option to the existing `ViewToggle` (`grid` | `list` | `graph`) and render a new component `src/components/vault/StoryGraph.tsx`.

Behavior:
- Each story = a small node (6–8 px). Larger nodes (12–16 px) for stories with more connections.
- Nodes are connected by thin lines when they share a `category` or any `tag` (cap edges per node to ~4 to avoid clutter).
- Force-directed layout using a lightweight in-house simulation (no new deps): repulsion + spring on edges + center gravity, ~120 ticks then settle. Gentle idle drift via `requestAnimationFrame` so it looks alive (particle-like).
- Hover a node → smoothly scales up (CSS transition 220ms) into a small card showing title, category, snippet, tags. Mouseleave → shrinks back. Connected edges/nodes highlight; others dim.
- Click a node → opens the existing `StoryEditorDialog` (same handler as grid).
- Colors reuse `BUBBLE_FILLS` palette for nodes; edges use `foreground/15`.
- Respects current `filtered` list (search/category/tag still apply).
- Selection mode: clicking toggles selection instead of opening, matching grid.

Reference look: dark-friendly graph similar to the user's screenshot, but tuned to the cream/Flow aesthetic in light mode and brand tints in dark mode.

## Technical notes
- New file: `src/components/vault/StoryGraph.tsx` (self-contained SVG + simulation, ~200 LOC).
- Extend `ViewMode` in `src/components/ui/view-toggle.tsx` to include `"graph"` with a Network/GitBranch icon.
- Reuse existing popover primitive `@/components/ui/popover`.
- No schema, no new deps.

## Files touched
- `src/pages/tabs/Stories.tsx` — toolbar refactor, render `<StoryGraph>` when `view === "graph"`.
- `src/components/ui/view-toggle.tsx` — add graph option.
- `src/components/vault/StoryGraph.tsx` — new.
