import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Wand2, Film, Upload, X, Image as ImageIcon, Music, Video } from "lucide-react";
import { toast } from "sonner";
import { TabNav } from "@/components/nav/TabNav";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useStories, uploadStoryMedia } from "@/hooks/use-stories";
import { ItemOverflowMenu } from "@/components/shared/ItemOverflowMenu";
import { ReimaginedPlayer } from "@/components/reimagined/ReimaginedPlayer";
import reimaginedIllustration from "@/assets/illustration-reimagined.png";

type Item = {
  id: string; title: string; angle: string | null; source_story_id: string | null;
  payload: any; created_at: string; cover_url: string | null; video_url: string | null;
  status: string; duration_seconds: number | null; video_prompt: string | null;
};

export default function Reimagined() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);

  const refetch = async () => {
    if (!user) return;
    const { data } = await supabase.from("reimagined_stories").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems((data ?? []) as Item[]);
  };
  useEffect(() => { refetch(); }, [user]);

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <TabNav active="Reimagined" />

      <div className="max-w-6xl mx-auto px-6 pt-8 pb-20">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div className="flex items-center gap-6">
            <img src={reimaginedIllustration} alt="Stick figure watching a cloud become a film" width={140} height={140} className="w-32 h-32 object-contain shrink-0" loading="lazy" />
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight">Reimagined.</h1>
              <p className="text-sm text-foreground/60 mt-1">Bring a story to life as a short film.</p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)} className="rounded-full">
            <Wand2 className="h-4 w-4 mr-2" /> Reimagine a story
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24 text-foreground/50 font-serif text-xl">Nothing yet — pick a story to bring to life.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((it) => <ReelCard key={it.id} item={it} onDeleted={refetch} />)}
          </div>
        )}
      </div>

      <ReimagineWizard open={open} onOpenChange={setOpen} onSaved={() => refetch()} />
    </div>
  );
}

function ReelCard({ item, onDeleted }: { item: Item; onDeleted: () => void }) {
  const hasVideo = !!item.video_url;
  return (
    <div className="group relative rounded-3xl overflow-hidden bg-background border border-foreground/10 shadow-sm hover:shadow-lg transition">
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <ItemOverflowMenu kind="reimagined" item={item} table="reimagined_stories" onDeleted={onDeleted} />
      </div>
      <div className="relative">
        {hasVideo ? (
          <ReimaginedPlayer src={item.video_url!} poster={item.cover_url} title={item.title} />
        ) : (
          <div className="aspect-video bg-foreground/5 relative overflow-hidden">
            {item.cover_url ? (
              <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-foreground/40">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 right-2 text-[10px] uppercase tracking-widest bg-background/90 backdrop-blur px-3 py-1.5 rounded-full text-foreground/70 flex items-center gap-2">
              <Film className="h-3 w-3" /> Video render queued · {item.duration_seconds ?? 30}s
            </div>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="text-[10px] uppercase tracking-widest text-foreground/50">{item.angle ?? "Reimagined"}</div>
        <h3 className="font-serif text-xl leading-tight mt-1">{item.title}</h3>
        {item.video_prompt && <p className="text-xs text-foreground/60 mt-2 line-clamp-3 italic">"{item.video_prompt}"</p>}
      </div>
    </div>
  );
}

function ReimagineWizard({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const { user } = useAuth();
  const { stories } = useStories();
  const [storyId, setStoryId] = useState("");
  const [duration, setDuration] = useState("30");
  const [busy, setBusy] = useState(false);

  // Uploads
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [useImageAsFirstFrame, setUseImageAsFirstFrame] = useState(true);
  const [useUploadedAudio, setUseUploadedAudio] = useState(true);
  const [uploadingKind, setUploadingKind] = useState<"image" | "video" | "audio" | null>(null);

  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const audRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setStoryId(""); setImageUrl(null); setVideoUrl(null); setAudioUrl(null);
    }
  }, [open]);

  const handleUpload = async (kind: "image" | "video" | "audio", file: File | null) => {
    if (!file || !user) return;
    setUploadingKind(kind);
    try {
      const url = await uploadStoryMedia(user.id, file);
      if (kind === "image") setImageUrl(url);
      if (kind === "video") setVideoUrl(url);
      if (kind === "audio") setAudioUrl(url);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploadingKind(null);
    }
  };

  const submit = async () => {
    if (!storyId && !imageUrl && !videoUrl) {
      toast.error("Pick a story or attach a reference photo/video");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("reimagine-story", {
      body: {
        story_id: storyId || null,
        duration_seconds: Number(duration),
        ref_image_url: imageUrl,
        ref_video_url: videoUrl,
        ref_audio_url: audioUrl,
        use_image_as_first_frame: !!imageUrl && useImageAsFirstFrame,
        use_uploaded_audio: !!audioUrl && useUploadedAudio,
      },
    });
    setBusy(false);
    if (error || data?.error) { toast.error(data?.error ?? error?.message ?? "Failed"); return; }
    toast.success(data?.reimagined?.video_url ? "Video rendered" : "Cover generated · video render queued");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Bring a story to life</DialogTitle>
          <DialogDescription>
            Pick a story and (optionally) attach a photo, clip, or audio to drive the AI render.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Source story</Label>
            <Select value={storyId} onValueChange={setStoryId}>
              <SelectTrigger><SelectValue placeholder="Choose a story (optional if you upload media)" /></SelectTrigger>
              <SelectContent>
                {stories.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="45">45 seconds</SelectItem>
                <SelectItem value="60">60 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-2 border-t border-foreground/10">
            <Label className="text-sm">Reference media (optional)</Label>
            <p className="text-xs text-foreground/55">Upload a photo, short clip, or audio. We'll attach them to the reimagined reel and feed them into the AI render.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <UploadSlot kind="image" icon={<ImageIcon className="h-4 w-4" />} url={imageUrl} uploading={uploadingKind === "image"} onPick={() => imgRef.current?.click()} onClear={() => setImageUrl(null)} />
              <input ref={imgRef} type="file" accept="image/*" hidden onChange={(e) => handleUpload("image", e.target.files?.[0] ?? null)} />

              <UploadSlot kind="video" icon={<Video className="h-4 w-4" />} url={videoUrl} uploading={uploadingKind === "video"} onPick={() => vidRef.current?.click()} onClear={() => setVideoUrl(null)} />
              <input ref={vidRef} type="file" accept="video/*" hidden onChange={(e) => handleUpload("video", e.target.files?.[0] ?? null)} />

              <UploadSlot kind="audio" icon={<Music className="h-4 w-4" />} url={audioUrl} uploading={uploadingKind === "audio"} onPick={() => audRef.current?.click()} onClear={() => setAudioUrl(null)} />
              <input ref={audRef} type="file" accept="audio/*" hidden onChange={(e) => handleUpload("audio", e.target.files?.[0] ?? null)} />
            </div>

            {imageUrl && (
              <label className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-foreground/5 mt-2">
                <span className="text-xs">Use my photo as the opening frame (image-to-video)</span>
                <Switch checked={useImageAsFirstFrame} onCheckedChange={setUseImageAsFirstFrame} />
              </label>
            )}
            {audioUrl && (
              <label className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-foreground/5">
                <span className="text-xs">Use my audio as the voiceover</span>
                <Switch checked={useUploadedAudio} onCheckedChange={setUseUploadedAudio} />
              </label>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy}>
            {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Reimagining…</> : <><Sparkles className="h-4 w-4 mr-2" />Reimagine</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadSlot({
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
    <div className="rounded-xl border border-foreground/10 bg-background/60 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-medium capitalize">
        <span className="flex items-center gap-1.5">{icon}{kind}</span>
        {url && (
          <button onClick={onClear} className="text-muted-foreground hover:text-destructive" aria-label="Remove">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {url ? (
        kind === "image" ? (
          <img src={url} className="rounded-md aspect-video object-cover w-full" alt="" />
        ) : kind === "audio" ? (
          <audio src={url} controls className="w-full" />
        ) : (
          <video src={url} controls className="w-full rounded-md aspect-video" />
        )
      ) : (
        <Button variant="outline" size="sm" className="rounded-lg" disabled={uploading} onClick={onPick}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
          Upload
        </Button>
      )}
    </div>
  );
}
