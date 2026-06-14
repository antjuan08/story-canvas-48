import { useEffect, useState } from "react";
import { Loader2, Sparkles, Wand2, Film } from "lucide-react";
import { toast } from "sonner";
import { TabNav } from "@/components/nav/TabNav";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useStories } from "@/hooks/use-stories";
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
            {items.map((it) => <ReelCard key={it.id} item={it} />)}
          </div>
        )}
      </div>

      <ReimagineWizard open={open} onOpenChange={setOpen} onSaved={() => refetch()} />
    </div>
  );
}

function ReelCard({ item }: { item: Item }) {
  const hasVideo = !!item.video_url;
  return (
    <div className="rounded-3xl overflow-hidden bg-background border border-foreground/10 shadow-sm hover:shadow-lg transition">
      <div className="aspect-video bg-foreground/5 relative overflow-hidden">
        {hasVideo ? (
          <video src={item.video_url!} poster={item.cover_url ?? undefined} controls className="w-full h-full object-cover" />
        ) : item.cover_url ? (
          <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-foreground/40">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        {!hasVideo && (
          <div className="absolute bottom-2 left-2 right-2 text-[10px] uppercase tracking-widest bg-background/90 backdrop-blur px-3 py-1.5 rounded-full text-foreground/70 flex items-center gap-2">
            <Film className="h-3 w-3" /> Video render queued · {item.duration_seconds ?? 30}s
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
  const { stories } = useStories();
  const [storyId, setStoryId] = useState("");
  const [duration, setDuration] = useState("30");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!storyId) { toast.error("Pick a story"); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("reimagine-story", {
      body: { story_id: storyId, duration_seconds: Number(duration) },
    });
    setBusy(false);
    if (error || data?.error) { toast.error(data?.error ?? error?.message ?? "Failed"); return; }
    toast.success("Cover generated · video render queued");
    onSaved();
    onOpenChange(false);
    setStoryId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Bring a story to life</DialogTitle>
          <DialogDescription>
            AI writes a film treatment and generates the cover frame. The full 30–60s video render is queued and will appear once a video model is connected.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Source story</Label>
            <Select value={storyId} onValueChange={setStoryId}>
              <SelectTrigger><SelectValue placeholder="Choose a story" /></SelectTrigger>
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
