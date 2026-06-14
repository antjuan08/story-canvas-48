import { useMemo, useState } from "react";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TabNav } from "@/components/nav/TabNav";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CloudsBackdrop } from "@/components/visuals/CloudsBackdrop";
import { CloudAddButton } from "@/components/visuals/CloudAddButton";
import { useStories, type Story } from "@/hooks/use-stories";
import { StoryEditorDialog } from "@/components/vault/StoryEditorDialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const BUBBLE_FILLS = [
  "bg-[hsl(48,70%,86%)]",
  "bg-[hsl(150,45%,84%)]",
  "bg-[hsl(25,80%,86%)]",
  "bg-[hsl(270,45%,88%)]",
  "bg-[hsl(200,55%,86%)]",
  "bg-[hsl(340,55%,88%)]",
];

const CATEGORIES = ["All", "Family", "Friendship", "Business", "Hard Times", "Love", "Travel", "Childhood", "Faith", "Other"] as const;
type Category = typeof CATEGORIES[number];

export default function Stories() {
  const { stories, refetch } = useStories();
  const [view, setView] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [editing, setEditing] = useState<Story | null>(null);
  const [open, setOpen] = useState(false);
  const [organizing, setOrganizing] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    stories.forEach((s) => (s.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).slice(0, 24);
  }, [stories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stories.filter((s) => {
      if (category !== "All" && (s.category ?? "Other") !== category) return false;
      if (activeTag && !(s.tags ?? []).includes(activeTag)) return false;
      if (q && !(s.title.toLowerCase().includes(q) || (s.body ?? "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [stories, query, category, activeTag]);

  const openStory = (s: Story) => { setEditing(s); setOpen(true); };

  // Bubble size shrinks as count grows: clamp(96px, 520/√n, 224px)
  const bubblePx = useMemo(() => {
    const n = Math.max(1, filtered.length);
    return Math.round(Math.max(96, Math.min(224, 520 / Math.sqrt(n))));
  }, [filtered.length]);

  const autoOrganize = async () => {
    const targets = stories.filter((s) => !s.category);
    if (targets.length === 0) { toast.info("Everything's already categorized"); return; }
    setOrganizing(true);
    try {
      for (const s of targets) {
        const { data, error } = await supabase.functions.invoke("categorize-story", {
          body: { title: s.title, body: s.body ?? "", existing_tags: s.tags ?? [] },
        });
        if (error || data?.error) continue;
        await supabase.from("stories").update({
          category: data.category, tags: data.tags ?? s.tags ?? [],
        }).eq("id", s.id);
      }
      toast.success(`Organized ${targets.length} story${targets.length === 1 ? "" : "ies"}`);
      refetch();
    } finally { setOrganizing(false); }
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] relative">
      <TabNav active="Stories" />

      {/* White clouds drift across the Stories backdrop */}
      <CloudsBackdrop className="z-0 opacity-40" variant="light" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-10">
        <style>{`
          @keyframes bubble-float {
            0%,100% { transform: translateY(0) rotate(0deg); }
            50%     { transform: translateY(-8px) rotate(-1.5deg); }
          }
          @keyframes bubble-float-hover {
            0%,100% { transform: translateY(-6px) scale(1.08) rotate(-2deg); }
            50%     { transform: translateY(-14px) scale(1.1) rotate(2deg); }
          }
          .bubble { animation: bubble-float 6s ease-in-out infinite; will-change: transform; }
          .bubble:hover { animation: bubble-float-hover 2.2s ease-in-out infinite; box-shadow: 0 18px 40px -10px rgba(0,0,0,0.35); z-index: 5; }
        `}</style>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-5xl font-light tracking-tight">Your stories</h1>
            <p className="text-sm text-foreground/60 mt-1">{stories.length} captured · floating like bubbles</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-full" onClick={autoOrganize} disabled={organizing}>
              {organizing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
              Auto-organize
            </Button>
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

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "px-3 py-1 rounded-full text-xs border transition",
                category === c
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background/60 border-foreground/15 text-foreground/70 hover:border-foreground/40"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-8">
            <span className="text-[10px] uppercase tracking-widest text-foreground/40 self-center mr-1">Tags</span>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTag(activeTag === t ? null : t)}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[11px] border transition",
                  activeTag === t
                    ? "bg-foreground text-background border-foreground"
                    : "border-foreground/15 text-foreground/60 hover:border-foreground/40"
                )}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-center my-10">
          <CloudAddButton
            onClick={() => { setEditing(null); setOpen(true); }}
            label="Add a story"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState />
        ) : view === "grid" ? (
          <div className="flex flex-wrap gap-6 items-center justify-center pb-20">
            {filtered.map((s, i) => (
              <button
                key={s.id}
                onClick={() => openStory(s)}
                className={cn(
                  "bubble group relative rounded-full p-6 text-center flex flex-col items-center justify-center border border-foreground/15 shadow-md transition-shadow overflow-hidden",
                  BUBBLE_FILLS[i % BUBBLE_FILLS.length],
                )}
                style={{
                  width: bubblePx,
                  height: bubblePx,
                  animationDelay: `${(i % 7) * 0.4}s`,
                }}
              >
                {s.category && (
                  <div className="text-[9px] uppercase tracking-widest text-black/60 mb-1">{s.category}</div>
                )}
                <h3 className="font-serif text-base leading-tight line-clamp-2 text-black px-2">{s.title}</h3>
                <p className="text-[11px] text-black/70 mt-1.5 line-clamp-2 px-2">{s.body?.slice(0, 80) ?? "—"}</p>
                {(s.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 justify-center">
                    {(s.tags ?? []).slice(0, 2).map((t) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/10 text-black/70">#{t}</span>
                    ))}
                  </div>
                )}
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
                  <div className="text-xs text-foreground/60 truncate">
                    {s.category && <span className="mr-2 uppercase tracking-widest text-[10px] text-foreground/50">{s.category}</span>}
                    {s.body?.slice(0, 120) ?? "—"}
                  </div>
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
      <div className="font-serif text-2xl mb-2">No stories here</div>
      <p className="text-sm">Try a different category, or visit Home to write a new one.</p>
    </div>
  );
}
