import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";

export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-foreground/15 bg-background/70 p-0.5">
      <button
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        className={cn("h-8 w-8 rounded-full flex items-center justify-center transition", value === "grid" ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground")}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange("list")}
        aria-label="List view"
        className={cn("h-8 w-8 rounded-full flex items-center justify-center transition", value === "list" ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground")}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
