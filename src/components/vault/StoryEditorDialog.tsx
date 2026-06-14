import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X, Image as ImageIcon, Music, Video, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { uploadStoryMedia, type Story, type Folder } from "@/hooks/use-stories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DictateButton } from "@/components/vault/DictateButton";
import { STORY_CATEGORIES } from "@/lib/categories";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  body: z.string().max(20000).optional(),
  category: z.string().max(80).optional(),
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  story?: Story | null;
  folders: Folder[];
  onSaved: () => void;
}

export function StoryEditorDialog({ open, onOpenChange, story, folders, onSaved }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [localFolders, setLocalFolders] = useState<Folder[]>(folders);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [savingFolder, setSavingFolder] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<"image" | "audio" | "video" | null>(null);

  const imgRef = useRef<HTMLInputElement>(null);
  const audRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalFolders(folders); }, [folders]);


  useEffect(() => {
    if (!open) return;
    setTitle(story?.title ?? "");
    setBody(story?.body ?? "");
    setCategory(story?.category ?? "");
    setTagsInput((story?.tags ?? []).join(", "));
    setFolderId(story?.folder_id ?? "");
    setImageUrl(story?.image_url ?? null);
    setAudioUrl(story?.audio_url ?? null);
    setVideoUrl(story?.video_url ?? null);
    setIsPublic(story?.is_public ?? false);
  }, [open, story]);

  const handleUpload = async (kind: "image" | "audio" | "video", file: File | null) => {
    if (!file || !user) return;
    setUploadingKind(kind);
    try {
      const url = await uploadStoryMedia(user.id, file);
      if (kind === "image") setImageUrl(url);
      if (kind === "audio") setAudioUrl(url);
      if (kind === "video") setVideoUrl(url);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploadingKind(null);
    }
  };

  const createFolder = async () => {
    if (!user) return;
    const name = newFolderName.trim();
    if (!name) return toast.error("Folder name required");
    setSavingFolder(true);
    const { data, error } = await supabase
      .from("folders")
      .insert({ user_id: user.id, name, context: "vault" })
      .select()
      .single();
    setSavingFolder(false);
    if (error || !data) return toast.error(error?.message ?? "Could not create folder");
    setLocalFolders((prev) => [...prev, data as Folder].sort((a, b) => a.name.localeCompare(b.name)));
    setFolderId(data.id);
    setNewFolderName("");
    setCreatingFolder(false);
    toast.success(`Folder "${name}" created`);
  };


  const save = async () => {
    if (!user) return;
    const parsed = schema.safeParse({ title, body, category });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20);

    setSaving(true);
    const payload = {
      user_id: user.id,
      title: title.trim(),
      body: body.trim() || null,
      category: category.trim() || null,
      folder_id: folderId || null,
      tags,
      image_url: imageUrl,
      audio_url: audioUrl,
      video_url: videoUrl,
      is_public: isPublic,
    };

    const { error } = story
      ? await supabase.from("stories").update(payload).eq("id", story.id)
      : await supabase.from("stories").insert(payload);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(story ? "Story updated" : "Story saved to your Vault");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{story ? "Edit story" : "New story"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The moment everything changed…" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Story</Label>
              <DictateButton
                onTranscript={(text) =>
                  setBody((prev) => (prev?.trim() ? prev.replace(/\s+$/, "") + " " + text : text))
                }
              />
            </div>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Tell it your way… or tap Dictate to speak."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select value={category || "none"} onValueChange={(v) => setCategory(v === "none" ? "" : v)}>
                <SelectTrigger id="category"><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {STORY_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Folder</Label>
              <Select value={folderId || "none"} onValueChange={(v) => setFolderId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="No folder" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="origin, family, lesson" />
          </div>

          {/* Media uploaders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MediaSlot
              kind="image"
              icon={<ImageIcon className="h-4 w-4" />}
              url={imageUrl}
              uploading={uploadingKind === "image"}
              onPick={() => imgRef.current?.click()}
              onClear={() => setImageUrl(null)}
            />
            <input ref={imgRef} type="file" accept="image/*" hidden onChange={(e) => handleUpload("image", e.target.files?.[0] ?? null)} />

            <MediaSlot
              kind="audio"
              icon={<Music className="h-4 w-4" />}
              url={audioUrl}
              uploading={uploadingKind === "audio"}
              onPick={() => audRef.current?.click()}
              onClear={() => setAudioUrl(null)}
            />
            <input ref={audRef} type="file" accept="audio/*" hidden onChange={(e) => handleUpload("audio", e.target.files?.[0] ?? null)} />

            <MediaSlot
              kind="video"
              icon={<Video className="h-4 w-4" />}
              url={videoUrl}
              uploading={uploadingKind === "video"}
              onPick={() => vidRef.current?.click()}
              onClear={() => setVideoUrl(null)}
            />
            <input ref={vidRef} type="file" accept="video/*" hidden onChange={(e) => handleUpload("video", e.target.files?.[0] ?? null)} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="rounded" />
            Share to Storytellers (public)
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-gradient-primary" disabled={saving} onClick={save}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MediaSlot({
  kind, icon, url, uploading, onPick, onClear,
}: {
  kind: string;
  icon: React.ReactNode;
  url: string | null;
  uploading: boolean;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div className="glass-card p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-medium capitalize">
        <span className="flex items-center gap-1.5">{icon}{kind}</span>
        {url && (
          <button onClick={onClear} className="text-muted-foreground hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {url ? (
        kind === "image" ? (
          <img src={url} className="rounded-lg aspect-video object-cover w-full" alt="" />
        ) : kind === "audio" ? (
          <audio src={url} controls className="w-full" />
        ) : (
          <video src={url} controls className="w-full rounded-lg aspect-video" />
        )
      ) : (
        <Button variant="outline" size="sm" className="rounded-xl" disabled={uploading} onClick={onPick}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
          Upload
        </Button>
      )}
    </div>
  );
}
