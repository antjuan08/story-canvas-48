import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const NAV_TABS = [
  { label: "Home", path: "/dashboard" },
  { label: "Stories", path: "/stories" },
  { label: "Keynote", path: "/keynote" },
  { label: "Podcast", path: "/podcast" },
  { label: "Book", path: "/book" },
  { label: "Reimagined", path: "/reimagined" },
] as const;

/** active prop is accepted but ignored — kept for back-compat. Route is the source of truth. */
export function TabNav({ active: _active }: { active?: string } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <nav className="hidden md:flex justify-center pt-2">
      <div className="flex flex-wrap items-center justify-center gap-1 rounded-full border border-foreground/10 bg-background/70 backdrop-blur-sm p-1 shadow-sm">
        {NAV_TABS.map((t) => {
          const isActive = location.pathname === t.path;
          return (
            <button
              key={t.label}
              onClick={() => navigate(t.path)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                isActive ? "bg-foreground text-background" : "text-foreground/70 hover:text-foreground hover:bg-foreground/5",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
