import { useMemo, useState } from "react";
import { Plus, Search, FolderPlus, Mic2, Folder as FolderIcon, MoreHorizontal, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useFolders } from "@/hooks/use-stories";
import { usePresentations, STAGE_TEMPLATES, type Presentation, type StageTemplate } from "@/hooks/use-presentations";
import { PresentationEditorDialog } from "@/components/stage/PresentationEditorDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const TEMPLATE_LABEL: Record<string, string> = Object.fromEntries(STAGE_TEMPLATES.map((t) => [t.value, t.label]));

export function Stage() {
  const { user } = useAuth();
  const { presentations, loading, refetch } = usePresentations();
  const { folders, refetch: refetchFolders } = useFolders("stage");

  const [search, setSearch] = useState("");
  const [activeTemplate, setActiveTemplate] = useState<StageTemplate | "all">("all");
  const [activeFolder, setActiveFolder] = useState<string | "all">("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Presentation | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return presentations.filter((p) => {
      if (activeTemplate !== "all" && p.template_type !== activeTemplate) return false;
      if (activeFolder !== "all" && p.folder_id !== activeFolder) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || (p.tags ?? []).some((t) => t.toLowerCase().includes(q));
    });
  }, [presentations, search, activeTemplate, activeFolder]);

  const openNew = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = (p: Presentation) => { setEditing(p); setEditorOpen(true); };

  const handleDelete = async (p: Presentation) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    const { error } = await supabase.from("presentations").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refetch();
  };

  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    const { error } = await supabase.from("folders").insert({
      user_id: user.id,
      name: newFolderName.trim(),
      context: "stage",
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
            <Mic2 className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">The Stage</h1>
          </div>
          <p className="text-muted-foreground">Shape your stories into sermons, keynotes, podcasts, and books.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl gap-2" onClick={() => setFolderDialogOpen(true)}>
            <FolderPlus className="h-4 w-4" /> New folder
          </Button>
          <Button className="rounded-2xl gap-2 bg-gradient-primary" onClick={openNew}>
            <Plus className="h-4 w-4" /> New presentation
          </Button>
        </div>
      </div>

      {/* Template selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAGE_TEMPLATES.map((t) => {
          const active = activeTemplate === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setActiveTemplate(active ? "all" : t.value)}
              className={cn(
                "text-left rounded-2xl border p-4 transition-apple",
                active ? "border-primary bg-primary-soft shadow-apple-sm" : "border-border hover:bg-accent",
              )}
            >
              <div className="font-semibold">{t.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search presentations, tags…"
          className="pl-9 rounded-2xl"
        />
      </div>

      {/* Folder pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Pill active={activeFolder === "all"} onClick={() => setActiveFolder("all")}>All ({presentations.length})</Pill>
        {folders.map((f) => (
          <Pill key={f.id} active={activeFolder === f.id} onClick={() => setActiveFolder(f.id)}>
            <FolderIcon className="h-3 w-3" /> {f.name}
          </Pill>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="glass-card p-12 text-center text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <h3 className="font-semibold text-lg mb-1">No presentations yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Pick a template and start shaping your next moment on the stage.</p>
          <Button className="rounded-2xl bg-gradient-primary" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> Create your first
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="glass-card p-5 hover:shadow-apple-lg transition-apple group">
              <div className="flex items-start justify-between mb-3">
                <Badge variant="secondary" className="rounded-full capitalize">{TEMPLATE_LABEL[p.template_type] ?? p.template_type}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-apple">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(p)}><Edit3 className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(p)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <button onClick={() => openEdit(p)} className="text-left w-full">
                <h3 className="font-semibold text-lg line-clamp-2 mb-2">{p.title}</h3>
              </button>
              {p.tags && p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {p.tags.slice(0, 4).map((t) => (
                    <Badge key={t} variant="outline" className="rounded-full text-xs">{t}</Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-3">Updated {new Date(p.updated_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      <PresentationEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        presentation={editing}
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

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-apple flex items-center gap-1.5",
        active ? "bg-primary text-primary-foreground shadow-apple-sm" : "bg-secondary text-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
