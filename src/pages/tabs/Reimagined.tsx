import { useEffect, useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { TabNav } from "@/components/nav/TabNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useStories } from "@/hooks/use-stories";

type Item = {
  id: string; title: string; angle: string | null; source_story_id: string | null;
  payload: any; created_at: string;
};

const POLAROID_TINTS = [
  "bg-[hsl(48,56%,95%)]",
  "bg-[hsl(25,80%,93%)]",
  "bg-[hsl(150,40%,92%)]",
  "bg-[hsl(270,30%,93%)]",
  "bg-[hsl(200,45%,93%)]",
];

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

  // Flatten variations into individual cards
  const cards = items.flatMap((it) => {
    const variations = (it.payload?.variations ?? []) as any[];
    return variations.map((v, i) => ({ key: `${it.id}-${i}`, parent: it, variation: v, i }));
  });

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <TabNav active="Reimagined" />

      <div className="max-w-6xl mx-auto px-6 pt-10 pb-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="font-serif text-5xl font-light tracking-tight">Reimagined.</h1>
            <p className="text-sm text-foreground/60 mt-1">Old stories, fresh lenses — pinned like polaroids.</p>
          </div>
          <Button onClick={() => setOpen(true)} className="rounded-full">
            <Wand2 className="h-4 w-4 mr-2" /> Reimagine a story
          </Button>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-24 text-foreground/50 font-serif text-xl">The collage is empty.</div>
        ) : (
          <div className="flex flex-wrap gap-8 justify-center">
            {cards.map((c, i) => {
              const rot = ((i * 137) % 11) - 5; // -5..+5deg
              return (
                <div
                  key={c.key}
                  className={`relative p-4 pb-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.25)] ${POLAROID_TINTS[i % POLAROID_TINTS.length]}`}
                  style={{ transform: `rotate(${rot}deg)`, width: 280 }}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground/10 rounded-sm" />
                  <div className="text-[10px] uppercase tracking-[0.25em] text-foreground/60">{c.variation.lens}</div>
                  <h3 className="font-serif text-xl leading-tight mt-1">{c.variation.title}</h3>
                  <p className="text-xs text-foreground/70 mt-2 line-clamp-6 leading-relaxed">{c.variation.snippet}</p>
                  <div className="mt-3 text-[10px] text-foreground/50 italic">{c.variation.mood}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReimagineWizard open={open} onOpenChange={setOpen} onSaved={() => refetch()} />
    </div>
  );
}

function ReimagineWizard({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const { stories } = useStories();
  const [storyId, setStoryId] = useState("");
  const [angle, setAngle] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!storyId) { toast.error("Pick a story"); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("reimagine-story", {
      body: { story_id: storyId, angle },
    });
    setBusy(false);
    if (error || data?.error) { toast.error(data?.error ?? error?.message ?? "Failed"); return; }
    toast.success("Reimagined");
    onSaved();
    onOpenChange(false);
    setStoryId(""); setAngle("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Reimagine</DialogTitle>
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
            <Label>Angle (optional)</Label>
            <Input value={angle} onChange={(e) => setAngle(e.target.value)} placeholder="As a myth, from the dog's POV…" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy}>
            {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Reimagining…</> : <><Sparkles className="h-4 w-4 mr-2" />Generate 3 variants</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
