import { SEO } from "@/components/seo/SEO";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Sparkles, Loader2, MoreHorizontal, CheckSquare, Trash2, FolderPlus, X } from "lucide-react";
import { toast } from "sonner";
import { TabNav } from "@/components/nav/TabNav";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CloudsBackdrop } from "@/components/visuals/CloudsBackdrop";
import { CloudAddButton } from "@/components/visuals/CloudAddButton";
import { useStories, useFolders, type Story } from "@/hooks/use-stories";
import { StoryEditorDialog } from "@/components/vault/StoryEditorDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { STORY_CATEGORIES } from "@/lib/categories";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Tag as TagIcon, Folder as FolderTagIcon } from "lucide-react";
import { StoryGraph } from "@/components/vault/StoryGraph";

const BUBBLE_FILLS = [
  "bg-[hsl(48,70%,86%)]",
  "bg-[hsl(150,45%,84%)]",
  "bg-[hsl(25,80%,86%)]",
  "bg-[hsl(270,45%,88%)]",
  "bg-[hsl(200,55%,86%)]",
  "bg-[hsl(340,55%,88%)]",
];

const CATEGORIES = ["All", ...STORY_CATEGORIES] as const;
type Category = typeof CATEGORIES[number];

export default function Stories() {
  const { user } = useAuth();
  const { stories, refetch } = useStories();
  const { folders, refetch: refetchFolders } = useFolders("vault");
  const [view, setView] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [editing, setEditing] = useState<Story | null>(null);
  const [open, setOpen] = useState(false);
  const [organizing, setOrganizing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Selection mode & folder dialog
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Deep-link: ?story=<id> opens that story in the editor dialog.
  useEffect(() => {
    const id = searchParams.get("story");
    if (!id || stories.length === 0) return;
    const match = stories.find((s) => s.id === id);
    if (match) {
      setEditing(match);
      setOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("story");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, stories, setSearchParams]);

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

  const exitSelect = () => { setSelectMode(false); setSelectedIds(new Set()); };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleCardClick = (s: Story) => {
    if (selectMode) toggleSelect(s.id);
    else { setEditing(s); setOpen(true); }
  };

  const selectAllVisible = () => setSelectedIds(new Set(filtered.map((s) => s.id)));

  // Bubble size shrinks as count grows
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

  const createFolder = async () => {
    if (!user) return;
    const name = newFolderName.trim();
    if (!name) { toast.error("Give your folder a name"); return; }
    setCreatingFolder(true);
    const { error } = await supabase.from("folders").insert({
      user_id: user.id, name, context: "vault",
    });
    setCreatingFolder(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Folder "${name}" created`);
    setNewFolderName("");
    setFolderDialogOpen(false);
    refetchFolders();
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    const { error } = await supabase
      .from("stories")
      .delete()
      .in("id", Array.from(selectedIds));
    setDeleting(false);
    setConfirmDelete(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Deleted ${selectedIds.size} story${selectedIds.size === 1 ? "" : "ies"}`);
    exitSelect();
    refetch();
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] relative">
      <SEO title="Your stories · StoryYou" description="Every story you've captured, floating like bubbles. Organize, search, and refine your story vault." path="/stories" />
      <TabNav active="Stories" />

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
            <p className="text-sm text-foreground/60 mt-1">
              {stories.length} captured · floating like bubbles
              {folders.length > 0 && <> · {folders.length} folder{folders.length === 1 ? "" : "s"}</>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Categories popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                  <FolderTagIcon className="h-3.5 w-3.5" />
                  Categories
                  {category !== "All" && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-foreground text-background text-[10px]">{category}</span>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="text-[10px] uppercase tracking-widest text-foreground/50 mb-2">Filter by category</div>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs border transition",
                        category === c
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background/60 border-foreground/15 text-foreground/70 hover:border-foreground/40",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Tags popover */}
            {allTags.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                    <TagIcon className="h-3.5 w-3.5" />
                    Tags
                    {activeTag && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-foreground text-background text-[10px]">#{activeTag}</span>
                    )}
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 max-h-80 overflow-auto">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] uppercase tracking-widest text-foreground/50">Filter by tag</div>
                    {activeTag && (
                      <button onClick={() => setActiveTag(null)} className="text-[10px] text-foreground/60 hover:text-foreground underline underline-offset-2">Clear</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveTag(activeTag === t ? null : t)}
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] border transition",
                          activeTag === t
                            ? "bg-foreground text-background border-foreground"
                            : "border-foreground/15 text-foreground/60 hover:border-foreground/40",
                        )}
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}

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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-9 w-9"
                  aria-label="More actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={() => { setSelectMode(true); setSelectedIds(new Set()); }}>
                  <CheckSquare className="h-4 w-4 mr-2" /> Select stories
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={selectedIds.size === 0}
                  onSelect={(e) => { e.preventDefault(); setConfirmDelete(true); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete selected {selectedIds.size > 0 && `(${selectedIds.size})`}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setFolderDialogOpen(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" /> New folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Selection bar */}
        {selectMode && (
          <div className="flex items-center justify-between gap-3 mb-4 px-4 py-2 rounded-full bg-foreground text-background text-sm">
            <span>{selectedIds.size} selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllVisible}
                className="text-xs px-3 py-1 rounded-full bg-background/15 hover:bg-background/25 transition"
              >
                Select all visible
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={selectedIds.size === 0}
                className="text-xs px-3 py-1 rounded-full bg-destructive text-destructive-foreground disabled:opacity-40 inline-flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
              <button
                onClick={exitSelect}
                className="text-xs px-3 py-1 rounded-full bg-background/15 hover:bg-background/25 transition inline-flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Done
              </button>
            </div>
          </div>
        )}

        {/* Filters now live in popovers in the toolbar above */}

        <div className="flex justify-center my-10">
          <CloudAddButton
            onClick={() => { setEditing(null); setOpen(true); }}
            label="Add a story"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState />
        ) : view === "graph" ? (
          <div className="pb-20">
            <StoryGraph
              stories={filtered}
              onSelect={handleCardClick}
              selectMode={selectMode}
              selectedIds={selectedIds}
            />
          </div>
        ) : view === "grid" ? (
          <div className="flex flex-wrap gap-6 items-center justify-center pb-20">
            <h2 className="sr-only">Your story bubbles</h2>
            {filtered.map((s, i) => {
              const isSelected = selectedIds.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => handleCardClick(s)}
                  className={cn(
                    "bubble group relative rounded-full p-6 text-center flex flex-col items-center justify-center border shadow-md transition-shadow overflow-hidden",
                    BUBBLE_FILLS[i % BUBBLE_FILLS.length],
                    isSelected ? "ring-4 ring-foreground border-foreground" : "border-foreground/15",
                  )}
                  style={{
                    width: bubblePx,
                    height: bubblePx,
                    animationDelay: `${(i % 7) * 0.4}s`,
                  }}
                >
                  {selectMode && (
                    <span className={cn(
                      "absolute top-2 right-2 h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px]",
                      isSelected ? "bg-foreground border-foreground text-background" : "border-foreground/40 bg-background/60",
                    )}>
                      {isSelected ? "✓" : ""}
                    </span>
                  )}
                  {s.category && (
                    <div className="text-[9px] uppercase tracking-widest text-black/60 mb-1">{s.category}</div>
                  )}
                  <h2 className="font-serif text-base leading-tight line-clamp-2 text-black px-2">{s.title}</h2>
                  <p className="text-[11px] text-black/70 mt-1.5 line-clamp-2 px-2">{s.body?.slice(0, 80) ?? "—"}</p>
                  {(s.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 justify-center">
                      {(s.tags ?? []).slice(0, 2).map((t) => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/10 text-black/70">#{t}</span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="divide-y divide-foreground/10 rounded-2xl border border-foreground/10 bg-background/60 overflow-hidden">
            {filtered.map((s) => {
              const isSelected = selectedIds.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => handleCardClick(s)}
                  className={cn(
                    "w-full text-left px-5 py-4 hover:bg-foreground/5 transition flex items-center gap-4",
                    isSelected && "bg-foreground/10",
                  )}
                >
                  {selectMode ? (
                    <span className={cn(
                      "h-4 w-4 rounded border-2 flex items-center justify-center text-[10px] shrink-0",
                      isSelected ? "bg-foreground border-foreground text-background" : "border-foreground/40",
                    )}>
                      {isSelected ? "✓" : ""}
                    </span>
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-foreground/40 shrink-0" />
                  )}
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
              );
            })}
          </div>
        )}
      </div>

      <StoryEditorDialog
        open={open}
        onOpenChange={setOpen}
        story={editing}
        folders={folders}
        onSaved={() => { setOpen(false); refetch(); }}
      />

      {/* New folder dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder name</Label>
            <Input
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Sermons, Keynotes, Memoir…"
              onKeyDown={(e) => { if (e.key === "Enter") createFolder(); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFolderDialogOpen(false)}>Cancel</Button>
            <Button onClick={createFolder} disabled={creatingFolder}>
              {creatingFolder && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} story{selectedIds.size === 1 ? "" : "ies"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the selected stories from your cloud. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteSelected}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
