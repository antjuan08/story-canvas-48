import { Link } from "react-router-dom";

const COLS: { title: string; links: { label: string; to: string }[] }[] = [
  { title: "Product", links: [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Stories", to: "/stories" },
    { label: "Keynote", to: "/keynote" },
    { label: "Podcast", to: "/podcast" },
    { label: "Book", to: "/book" },
    { label: "Reimagined", to: "/reimagined" },
  ]},
  { title: "Stories", links: [
    { label: "All stories", to: "/stories" },
    { label: "New story", to: "/dashboard" },
    { label: "Reimagined", to: "/reimagined" },
  ]},
  { title: "Keynotes", links: [
    { label: "Build a keynote", to: "/keynote" },
    { label: "My keynotes", to: "/keynote" },
  ]},
  { title: "Company", links: [
    { label: "About", to: "/" },
    { label: "Journal", to: "/" },
  ]},
  { title: "Contact", links: [
    { label: "Support", to: "/" },
    { label: "Press", to: "/" },
  ]},
  { title: "Careers", links: [
    { label: "Open roles", to: "/" },
    { label: "Culture", to: "/" },
  ]},
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-foreground/10 bg-background/60">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
        {COLS.map((col) => (
          <div key={col.title}>
            <h4 className="font-serif text-sm mb-3 text-foreground">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-xs text-foreground/60 hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-foreground/10 px-6 py-5 text-xs text-foreground/50 flex justify-between max-w-7xl mx-auto">
        <span>2026 © Storyou LLC</span>
        <span className="font-serif">Kept like clouds.</span>
      </div>
    </footer>
  );
}
