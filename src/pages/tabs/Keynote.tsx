import { SEO } from "@/components/seo/SEO";
import { useEffect, useState } from "react";
import { Loader2, Plus, Sparkles, Mic } from "lucide-react";
import { toast } from "sonner";
import { TabNav } from "@/components/nav/TabNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { StoryPicker } from "@/components/builders/StoryPicker";
import { ItemOverflowMenu } from "@/components/shared/ItemOverflowMenu";
import { FeedbackDialog } from "@/components/keynote/FeedbackDialog";
import keynoteIllustration from "@/assets/illustration-keynote.png";


type Keynote = {
  id: string; title: string; audience: string | null; tone: string | null; length: string | null;
  payload: any; created_at: string;
};

export default function Keynote() {
  const { user } = useAuth();
  const [keynotes, setKeynotes] = useState<Keynote[]>([]);
  const [view, setView] = useState<ViewMode>("grid");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Keynote | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const refetch = async () => {
    if (!user) return;
    const { data } = await supabase.from("keynotes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setKeynotes((data ?? []) as Keynote[]);
  };
  useEffect(() => { refetch(); }, [user]);

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <SEO title="Keynote builder · StoryYou" description="Turn your stories into stage-ready keynotes. Get AI feedback from a coach calibrated to CEOs, public speakers, storytellers, and communicators." path="/keynote" />
      <TabNav active="Keynote" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20 grid lg:grid-cols-[1fr_2fr] gap-8 lg:gap-10 items-start">
        {/* LEFT — illustration + saved keynotes */}
        <aside>
          <img
            src={keynoteIllustration}
            alt="Stick figure giving a keynote talk"
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20 grid lg:grid-cols-[1fr_2fr] gap-8 lg:gap-10 items-start">
            className="w-full max-w-[240px] sm:max-w-[360px] object-contain mb-6 mx-auto lg:mx-0"
            loading="lazy"
          />
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-2xl">Saved keynotes</h2>
            <ViewToggle value={view} onChange={setView} />
          </div>
          {keynotes.length === 0 ? (
            <p className="text-sm text-foreground/50">None yet — build your first.</p>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-3">
              {keynotes.map((k) => (
                <div key={k.id} className="relative group">
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ItemOverflowMenu kind="keynote" item={k} table="keynotes" onDeleted={refetch} />
                  </div>
                  <button onClick={() => setSelected(k)}
                    className="w-full text-left rounded-2xl border border-foreground/10 bg-background/70 p-4 hover:shadow-md transition aspect-square flex flex-col">
                    <Sparkles className="h-4 w-4 text-foreground/40 mb-2" />
                    <div className="font-serif text-base leading-tight line-clamp-3">{k.title}</div>
                    <div className="text-[10px] text-foreground/50 mt-auto">{k.length ?? ""}</div>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-foreground/10 rounded-xl border border-foreground/10 overflow-hidden">
              {keynotes.map((k) => (
                <li key={k.id} className="relative flex items-center">
                  <button onClick={() => setSelected(k)} className="flex-1 text-left px-4 py-3 hover:bg-foreground/5">
                    <div className="font-serif text-sm">{k.title}</div>
                    <div className="text-xs text-foreground/50">{k.audience ?? "—"}</div>
                  </button>
                  <div className="pr-3"><ItemOverflowMenu kind="keynote" item={k} table="keynotes" onDeleted={refetch} /></div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* RIGHT — builder/preview, lifted to sit at the same level as the illustration */}
        <section>
          <div className="rounded-3xl border border-foreground/10 bg-background/80 p-5 sm:p-8 min-h-[60vh] relative">
            {!selected ? (
              <div className="text-center py-10 sm:py-16">
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Build a keynote.</h1>
                <p className="text-foreground/60 mt-3 max-w-md mx-auto text-sm sm:text-base">
                  Answer five quick questions. AI weaves your stories into a talkable outline.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-8">
                  <Button onClick={() => setOpen(true)} size="lg" className="rounded-full">
                    <Plus className="h-4 w-4 mr-2" /> New keynote
                  </Button>
                  <Button onClick={() => setFeedbackOpen(true)} size="lg" className="rounded-full bg-[hsl(var(--brand-sermon-red))] hover:bg-[hsl(var(--brand-sermon-red))]/90 text-white border-0">
                    <Mic className="h-4 w-4 mr-2" /> Feedback
                  </Button>
                </div>
                <p className="text-xs text-foreground/50 mt-4 px-2">Rehearse and get instant AI coaching on pacing, clarity & structure.</p>
              </div>
            ) : (
              <KeynoteView k={selected} onClose={() => setSelected(null)} />
            )}
          </div>
        </section>
      </div>

      <KeynoteWizard open={open} onOpenChange={setOpen} onSaved={(k) => { refetch(); setSelected(k); }} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}


function KeynoteView({ k, onClose }: { k: Keynote; onClose: () => void }) {
  const p = k.payload ?? {};
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  return (
    <article className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-foreground/50">Keynote</div>
          <h2 className="font-serif text-3xl mt-1">{p.title ?? k.title}</h2>
          <div className="text-xs text-foreground/50 mt-1">{[k.audience, k.tone, k.length].filter(Boolean).join(" · ")}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="rounded-full bg-[hsl(var(--brand-sermon-red))] hover:bg-[hsl(var(--brand-sermon-red))]/90 text-white border-0" onClick={() => setFeedbackOpen(true)}>
            <Mic className="h-3.5 w-3.5 mr-1.5" /> Feedback
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
      {p.opening && <p className="font-serif text-lg italic leading-relaxed">{p.opening}</p>}
      <div className="space-y-4">
        {(p.talking_points ?? []).map((tp: any, i: number) => (
          <div key={i} className="flex gap-4">
            <div className="text-foreground/40 font-serif text-2xl shrink-0 w-8">{i + 1}</div>
            <div>
              <div className="font-serif text-lg">{tp.headline}</div>
              <p className="text-sm text-foreground/70 mt-1">{tp.detail}</p>
            </div>
          </div>
        ))}
      </div>
      {p.closing && (
        <div className="border-t border-foreground/10 pt-5">
          <div className="text-xs uppercase tracking-widest text-foreground/50 mb-2">Closing</div>
          <p className="font-serif text-lg italic">{p.closing}</p>
        </div>
      )}
      {Array.isArray(p.callouts) && p.callouts.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {p.callouts.map((c: string, i: number) => (
            <span key={i} className="text-xs rounded-full bg-foreground/5 px-3 py-1.5 border border-foreground/10">{c}</span>
          ))}
        </div>
      )}
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} topic={p.title ?? k.title} />
    </article>
  );
}

function KeynoteWizard({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: (k: Keynote) => void }) {
  const [step, setStep] = useState(0);
  const [audience, setAudience] = useState("");
  const [coreMessage, setCoreMessage] = useState("");
  const [tone, setTone] = useState("warm, confident");
  const [length, setLength] = useState("12 minutes");
  const [storyIds, setStoryIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!open) { setStep(0); setStoryIds([]); } }, [open]);

  const submit = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("keynote-builder", {
      body: { audience, core_message: coreMessage, tone, length, story_ids: storyIds },
    });
    setBusy(false);
    if (error || data?.error) { toast.error(data?.error ?? error?.message ?? "Failed"); return; }
    toast.success("Keynote built");
    onSaved(data.keynote);
    onOpenChange(false);
  };

  const steps = [
    { label: "Audience", node: (
      <div className="space-y-2"><Label>Who's in the room?</Label>
        <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Product designers at a conference" /></div>
    )},
    { label: "Core message", node: (
      <div className="space-y-2"><Label>What must they leave with?</Label>
        <Textarea value={coreMessage} onChange={(e) => setCoreMessage(e.target.value)} rows={3} placeholder="The one big idea…" /></div>
    )},
    { label: "Tone", node: (
      <div className="space-y-2"><Label>Tone</Label>
        <Input value={tone} onChange={(e) => setTone(e.target.value)} /></div>
    )},
    { label: "Length", node: (
      <div className="space-y-2"><Label>Length</Label>
        <Input value={length} onChange={(e) => setLength(e.target.value)} /></div>
    )},
    { label: "Stories", node: (
      <StoryPicker
        purpose="keynote"
        context={`Audience: ${audience}\nCore message: ${coreMessage}\nTone: ${tone}\nLength: ${length}`}
        selected={storyIds}
        onChange={setStoryIds}
      />
    )},
  ];


  const isLast = step === steps.length - 1;

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
            <Button onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <Button onClick={submit} disabled={busy}>
              {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Building…</> : <><Sparkles className="h-4 w-4 mr-2" />Build keynote</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
