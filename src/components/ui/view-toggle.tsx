import { LayoutGrid, List, Network } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list" | "graph";

export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const items: { mode: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { mode: "grid", label: "Grid view", icon: LayoutGrid },
    { mode: "list", label: "List view", icon: List },
    { mode: "graph", label: "Graph view", icon: Network },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-foreground/15 bg-background/70 p-0.5">
      {items.map(({ mode, label, icon: Icon }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          aria-label={label}
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center transition",
            value === mode ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
