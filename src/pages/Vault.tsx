import { useMemo, useState } from "react";
import { Plus, Search, FolderPlus, Lock, Folder as FolderIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useStories, useFolders, gradeStory, type Story } from "@/hooks/use-stories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StoryEditorDialog } from "@/components/vault/StoryEditorDialog";
import { StoryCard } from "@/components/vault/StoryCard";
import { cn } from "@/lib/utils";

export function Vault() {
  const { user } = useAuth();
  const { stories, loading, refetch } = useStories();
  const { folders, refetch: refetchFolders } = useFolders("vault");

  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | "all" | "none">("all");
  const [activeGrade, setActiveGrade] = useState<"all" | "A" | "B" | "C" | "D">("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Story | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return stories.filter((s) => {
      if (activeFolder === "none" && s.folder_id) return false;
      if (activeFolder !== "all" && activeFolder !== "none" && s.folder_id !== activeFolder) return false;
      if (activeGrade !== "all" && gradeStory(s) !== activeGrade) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        (s.body ?? "").toLowerCase().includes(q) ||
        (s.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [stories, search, activeFolder, activeGrade]);

  const openNew = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = (s: Story) => { setEditing(s); setEditorOpen(true); };

  const handleDelete = async (s: Story) => {
    if (!confirm(`Delete "${s.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("stories").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Story deleted");
    refetch();
  };

  const handleDuplicate = async (s: Story) => {
    if (!user) return;
    const { error } = await supabase.from("stories").insert({
      user_id: user.id,
      title: `${s.title} (copy)`,
      body: s.body,
      image_url: s.image_url,
      audio_url: s.audio_url,
      video_url: s.video_url,
      tags: s.tags ?? [],
      category: s.category,
      folder_id: s.folder_id,
      is_public: false,
    });
    if (error) return toast.error(error.message);
    toast.success("Duplicated");
    refetch();
  };

  const handleMoveFolder = async (s: Story, folderId: string | null) => {
    const { error } = await supabase.from("stories").update({ folder_id: folderId }).eq("id", s.id);
    if (error) return toast.error(error.message);
    refetch();
  };

  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    const { error } = await supabase.from("folders").insert({
      user_id: user.id,
      name: newFolderName.trim(),
      context: "vault",
    });
    if (error) return toast.error(error.message);
    setNewFolderName("");
    setFolderDialogOpen(false);
    refetchFolders();
    toast.success("Folder created");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">The Vault</h1>
          </div>
          <p className="text-muted-foreground">Your stories, safe and ready to use.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl gap-2" onClick={() => setFolderDialogOpen(true)}>
            <FolderPlus className="h-4 w-4" /> New folder
          </Button>
          <Button className="rounded-2xl gap-2 bg-gradient-primary" onClick={openNew}>
            <Plus className="h-4 w-4" /> New story
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stories, tags, content…"
          className="pl-9 rounded-2xl"
        />
      </div>

      {/* Folder pills + grade filter */}
      <div className="flex flex-wrap items-center gap-2">
        <FolderPill active={activeFolder === "all"} onClick={() => setActiveFolder("all")}>
          All ({stories.length})
        </FolderPill>
        <FolderPill active={activeFolder === "none"} onClick={() => setActiveFolder("none")}>
          Unfiled
        </FolderPill>
        {folders.map((f) => (
          <FolderPill key={f.id} active={activeFolder === f.id} onClick={() => setActiveFolder(f.id)}>
            <FolderIcon className="h-3 w-3" /> {f.name}
          </FolderPill>
        ))}
        <div className="ml-auto flex items-center gap-1 text-xs">
          <span className="text-muted-foreground mr-1">Grade:</span>
          {(["all", "A", "B", "C", "D"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setActiveGrade(g)}
              className={cn(
                "px-2 py-1 rounded-md transition-apple",
                activeGrade === g ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
            >
              {g === "all" ? "All" : g}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="glass-card p-12 text-center text-muted-foreground">Loading your stories…</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <h3 className="font-semibold text-lg mb-1">No stories yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Start your collection — every story you save becomes a building block for keynotes, podcasts, and books.</p>
          <Button className="rounded-2xl bg-gradient-primary" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> Add your first story
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <StoryCard
              key={s.id}
              story={s}
              folders={folders}
              onEdit={openEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onMoveFolder={handleMoveFolder}
            />
          ))}
        </div>
      )}

      <StoryEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        story={editing}
        folders={folders}
        onSaved={refetch}
      />

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New folder</DialogTitle></DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFolderDialogOpen(false)}>Cancel</Button>
            <Button className="bg-gradient-primary" onClick={createFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FolderPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-apple flex items-center gap-1.5",
        active ? "bg-primary text-primary-foreground shadow-apple-sm" : "bg-secondary text-foreground hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}
