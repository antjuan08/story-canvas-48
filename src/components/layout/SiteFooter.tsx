import { Link } from "react-router-dom";

const COLS: { title: string; links: { label: string; to: string }[] }[] = [
  { title: "Product", links: [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Stories", to: "/stories" },
    { label: "Keynote", to: "/keynote" },
    { label: "Podcast", to: "/podcast" },
    { label: "Book", to: "/book" },
    { label: "Reimagined", to: "/reimagined" },
    { label: "Feedback", to: "/keynote" },
  ]},
  { title: "You", links: [
    { label: "Profile", to: "/profile" },
    { label: "Billing", to: "/profile" },
    { label: "Brand voice", to: "/profile" },
  ]},
  { title: "Community", links: [
    { label: "Community feed", to: "/community" },
    { label: "Share a story", to: "/community" },
    { label: "Testimonials", to: "/testimonials" },
  ]},
  { title: "Plans", links: [
    { label: "Pricing", to: "/welcome" },
    { label: "Buy credits", to: "/profile" },
  ]},
  { title: "Company", links: [
    { label: "About", to: "/" },
    { label: "Journal", to: "/" },
  ]},
  { title: "Contact", links: [
    { label: "Support", to: "/" },
    { label: "Press", to: "/" },
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
