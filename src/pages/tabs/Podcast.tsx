import { useEffect, useState } from "react";
import { Loader2, Mic, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { TabNav } from "@/components/nav/TabNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useStories } from "@/hooks/use-stories";

type Podcast = {
  id: string; show_name: string; episode_title: string; topic: string | null;
  format: string | null; length: string | null; payload: any; created_at: string;
};

export default function Podcast() {
  const { user } = useAuth();
  const [items, setItems] = useState<Podcast[]>([]);
  const [view, setView] = useState<ViewMode>("grid");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Podcast | null>(null);

  const refetch = async () => {
    if (!user) return;
    const { data } = await supabase.from("podcasts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems((data ?? []) as Podcast[]);
  };
  useEffect(() => { refetch(); }, [user]);

  return (
    <div className="min-h-[calc(100vh-7rem)] relative">
      <TabNav active="Podcast" />

      <div className="max-w-6xl mx-auto px-6 pt-10 pb-32">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-serif text-5xl font-light tracking-tight">On the mic.</h1>
            <p className="text-sm text-foreground/60 mt-1">{items.length} episodes drafted</p>
          </div>
          <ViewToggle value={view} onChange={setView} />
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24 text-foreground/50">
            <Mic className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <div className="font-serif text-2xl mb-1">No episodes yet</div>
            <p className="text-sm">Tap the + button to draft your first show.</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p, i) => (
              <button key={p.id} onClick={() => setSelected(p)} className="group text-left rounded-3xl bg-background/80 border border-foreground/10 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5">
                <div className={`h-32 ${COVERS[i % COVERS.length]} flex items-end p-4`}>
                  <div className="text-background/90 text-xs uppercase tracking-widest">{p.show_name}</div>
                </div>
                <div className="p-5">
                  <div className="font-serif text-xl leading-tight line-clamp-2">{p.episode_title}</div>
                  <p className="text-xs text-foreground/60 mt-2 line-clamp-2">{p.payload?.logline ?? p.topic ?? "—"}</p>
                  <div className="text-[10px] text-foreground/50 mt-3 uppercase tracking-widest">
                    {p.format} · {p.length}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-foreground/10 rounded-2xl border border-foreground/10 bg-background/60 overflow-hidden">
            {items.map((p) => (
              <li key={p.id}>
                <button onClick={() => setSelected(p)} className="w-full px-5 py-4 text-left hover:bg-foreground/5 flex items-center gap-4">
                  <Mic className="h-4 w-4 text-foreground/50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-base truncate">{p.episode_title}</div>
                    <div className="text-xs text-foreground/50 truncate">{p.show_name} · {p.format}</div>
                  </div>
                  <span className="text-xs text-foreground/50">{new Date(p.created_at).toLocaleDateString()}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        aria-label="New podcast"
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-foreground text-background flex items-center justify-center shadow-2xl hover:scale-105 transition z-30"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          {selected && <PodcastView p={selected} />}
        </DialogContent>
      </Dialog>

      <PodcastWizard open={open} onOpenChange={setOpen} onSaved={() => refetch()} />
    </div>
  );
}

const COVERS = [
  "bg-foreground", "bg-[hsl(270,40%,30%)]", "bg-[hsl(25,60%,30%)]",
  "bg-[hsl(200,40%,25%)]", "bg-[hsl(150,30%,25%)]", "bg-[hsl(0,0%,20%)]",
];

function PodcastView({ p }: { p: Podcast }) {
  const x = p.payload ?? {};
  return (
    <div className="space-y-5">
      <DialogHeader>
        <div className="text-xs uppercase tracking-widest text-foreground/50">{p.show_name}</div>
        <DialogTitle className="font-serif text-3xl">{x.episode_title ?? p.episode_title}</DialogTitle>
        {x.logline && <p className="text-sm text-foreground/70 italic">{x.logline}</p>}
      </DialogHeader>
      {x.intro_script && (
        <section>
          <div className="text-xs uppercase tracking-widest text-foreground/50 mb-1">Intro</div>
          <p className="text-sm leading-relaxed">{x.intro_script}</p>
        </section>
      )}
      <section className="space-y-3">
        <div className="text-xs uppercase tracking-widest text-foreground/50">Segments</div>
        {(x.segments ?? []).map((s: any, i: number) => (
          <div key={i} className="rounded-xl border border-foreground/10 p-4">
            <div className="flex items-center justify-between">
              <div className="font-serif text-lg">{s.name}</div>
              <div className="text-xs text-foreground/50">{s.minutes} min</div>
            </div>
            <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-foreground/70">
              {(s.talking_points ?? []).map((tp: string, j: number) => <li key={j}>{tp}</li>)}
            </ul>
          </div>
        ))}
      </section>
      {x.outro_script && (
        <section>
          <div className="text-xs uppercase tracking-widest text-foreground/50 mb-1">Outro</div>
          <p className="text-sm leading-relaxed">{x.outro_script}</p>
        </section>
      )}
      {Array.isArray(x.show_notes) && x.show_notes.length > 0 && (
        <section>
          <div className="text-xs uppercase tracking-widest text-foreground/50 mb-1">Show notes</div>
          <ul className="list-disc list-inside text-sm space-y-1 text-foreground/70">
            {x.show_notes.map((n: string, i: number) => <li key={i}>{n}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

function PodcastWizard({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const { stories } = useStories();
  const [step, setStep] = useState(0);
  const [showName, setShowName] = useState("");
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("solo narrative");
  const [length, setLength] = useState("20 minutes");
  const [storyIds, setStoryIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!open) setStep(0); }, [open]);

  const submit = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("podcast-builder", {
      body: { show_name: showName, topic, format, length, story_ids: storyIds },
    });
    setBusy(false);
    if (error || data?.error) { toast.error(data?.error ?? error?.message ?? "Failed"); return; }
    toast.success("Episode drafted");
    onSaved();
    onOpenChange(false);
  };

  const steps = [
    { label: "Show", node: (
      <div className="space-y-2"><Label>Show name</Label>
        <Input value={showName} onChange={(e) => setShowName(e.target.value)} placeholder="The Long Way Home" /></div>
    )},
    { label: "Topic", node: (
      <div className="space-y-2"><Label>What's this episode about?</Label>
        <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} /></div>
    )},
    { label: "Format", node: (
      <div className="space-y-2"><Label>Format</Label>
        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="solo narrative">Solo narrative</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="documentary">Documentary</SelectItem>
            <SelectItem value="conversational">Conversational</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )},
    { label: "Length", node: (
      <div className="space-y-2"><Label>Target length</Label>
        <Input value={length} onChange={(e) => setLength(e.target.value)} /></div>
    )},
    { label: "Pull stories", node: (
      <div className="space-y-2">
        <Label>Stories to pull from ({storyIds.length} selected)</Label>
        <div className="max-h-64 overflow-auto rounded-xl border border-foreground/10 divide-y divide-foreground/10">
          {stories.length === 0 && <div className="p-4 text-sm text-foreground/50">No stories yet. Skip this step.</div>}
          {stories.map((s) => {
            const checked = storyIds.includes(s.id);
            return (
              <label key={s.id} className="flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-foreground/5">
                <Checkbox checked={checked} onCheckedChange={(v) => {
                  setStoryIds((prev) => v ? [...prev, s.id] : prev.filter((x) => x !== s.id));
                }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.title}</div>
                  <div className="text-xs text-foreground/50 truncate">{s.body?.slice(0, 80) ?? "—"}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    )},
  ];

  const isLast = step === steps.length - 1;
  const canNext = step !== 0 || showName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{steps[step].label}</DialogTitle>
          <div className="text-xs text-foreground/50">Step {step + 1} of {steps.length}</div>
        </DialogHeader>
        <div className="py-2">{steps[step].node}</div>
        <DialogFooter>
          {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={busy}>Back</Button>}
          {!isLast ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>Next</Button>
          ) : (
            <Button onClick={submit} disabled={busy || !showName.trim()}>
              {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Drafting…</> : <><Sparkles className="h-4 w-4 mr-2" />Build episode</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
