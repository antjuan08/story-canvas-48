import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TabNav } from "@/components/nav/TabNav";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { Input } from "@/components/ui/input";
import { useStories, type Story } from "@/hooks/use-stories";
import { StoryEditorDialog } from "@/components/vault/StoryEditorDialog";
import { cn } from "@/lib/utils";

const BUBBLE_FILLS = [
  "bg-[hsl(48,56%,92%)]",
  "bg-[hsl(150,40%,90%)]",
  "bg-[hsl(25,80%,90%)]",
  "bg-[hsl(270,40%,92%)]",
  "bg-[hsl(200,50%,92%)]",
  "bg-[hsl(0,0%,96%)]",
];
const BUBBLE_SIZES = ["h-44 w-44", "h-52 w-52", "h-40 w-40", "h-48 w-48", "h-56 w-56", "h-44 w-44"];

export default function Stories() {
  const { stories, refetch } = useStories();
  const [view, setView] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Story | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stories;
    return stories.filter(
      (s) => s.title.toLowerCase().includes(q) || (s.body ?? "").toLowerCase().includes(q),
    );
  }, [stories, query]);

  const openStory = (s: Story) => { setEditing(s); setOpen(true); };

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <TabNav active="Stories" />

      <div className="max-w-6xl mx-auto px-6 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-5xl font-light tracking-tight">Your stories</h1>
            <p className="text-sm text-foreground/60 mt-1">{stories.length} captured · floating like bubbles</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stories…"
                className="pl-9 rounded-full bg-background/80 w-64"
              />
            </div>
            <ViewToggle value={view} onChange={setView} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState />
        ) : view === "grid" ? (
          <div className="flex flex-wrap gap-6 items-end justify-center pb-20">
            {filtered.map((s, i) => (
              <button
                key={s.id}
                onClick={() => openStory(s)}
                className={cn(
                  "group relative rounded-full p-6 text-left flex flex-col justify-end border border-foreground/10 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all",
                  BUBBLE_FILLS[i % BUBBLE_FILLS.length],
                  BUBBLE_SIZES[i % BUBBLE_SIZES.length],
                )}
                style={{ transform: `translateY(${(i % 3) * 6}px)` }}
              >
                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-foreground/40" />
                <h3 className="font-serif text-lg leading-tight line-clamp-2">{s.title}</h3>
                <p className="text-xs text-foreground/60 mt-2 line-clamp-3">{s.body?.slice(0, 100) ?? "—"}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-foreground/10 rounded-2xl border border-foreground/10 bg-background/60 overflow-hidden">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => openStory(s)}
                className="w-full text-left px-5 py-4 hover:bg-foreground/5 transition flex items-center gap-4"
              >
                <div className="h-2 w-2 rounded-full bg-foreground/40 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-base truncate">{s.title}</div>
                  <div className="text-xs text-foreground/60 truncate">{s.body?.slice(0, 140) ?? "—"}</div>
                </div>
                <div className="text-xs text-foreground/50 shrink-0">
                  {new Date(s.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <StoryEditorDialog
        open={open}
        onOpenChange={setOpen}
        story={editing}
        folders={[]}
        onSaved={() => { setOpen(false); refetch(); }}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 text-foreground/50">
      <div className="font-serif text-2xl mb-2">No stories yet</div>
      <p className="text-sm">Visit Home and write your first story.</p>
    </div>
  );
}
