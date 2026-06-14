// TabNav is now rendered inside TopBar (see src/components/layout/TopBar.tsx).
// This component is kept as a no-op for back-compat with existing imports.

export const NAV_TABS = [
  { label: "Home", path: "/dashboard" },
  { label: "Stories", path: "/stories" },
  { label: "Keynote", path: "/keynote" },
  { label: "Podcast", path: "/podcast" },
  { label: "Book", path: "/book" },
  { label: "Reimagined", path: "/reimagined" },
] as const;

export function TabNav(_props: { active?: string } = {}) {
  return null;
}
