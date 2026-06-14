import { useEffect, useState } from "react";
import { Loader2, Mic, Sparkles, GraduationCap, Heart, PartyPopper, MessagesSquare } from "lucide-react";
import { CloudAddButton } from "@/components/visuals/CloudAddButton";
import { toast } from "sonner";
import { TabNav } from "@/components/nav/TabNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { StoryPicker } from "@/components/builders/StoryPicker";
import { ItemOverflowMenu } from "@/components/shared/ItemOverflowMenu";
import podcastIllustration from "@/assets/illustration-podcast.png";


type Podcast = {
  id: string; show_name: string; episode_title: string; topic: string | null;
  format: string | null; length: string | null; payload: any; created_at: string;
};

const TEMPLATES = [
  { id: "educational",   label: "Educational",   icon: GraduationCap,  format: "documentary",     tone: "clear, informed, curious",  desc: "Teach a concept clearly with examples." },
  { id: "encouraging",   label: "Encouraging",   icon: Heart,          format: "solo narrative",  tone: "warm, uplifting, hopeful",  desc: "Lift the listener with a heart-led story." },
  { id: "entertaining",  label: "Entertaining",  icon: PartyPopper,    format: "conversational",  tone: "playful, energetic, witty", desc: "Keep it lively, surprising, fun." },
  { id: "conversational",label: "Conversational",icon: MessagesSquare, format: "interview",       tone: "natural, candid, curious",  desc: "Two voices, real talk, deep questions." },
] as const;

type TemplateId = typeof TEMPLATES[number]["id"];

export default function Podcast() {
  const { user } = useAuth();
  const [items, setItems] = useState<Podcast[]>([]);
  const [view, setView] = useState<ViewMode>("grid");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [template, setTemplate] = useState<TemplateId | null>(null);
  const [selected, setSelected] = useState<Podcast | null>(null);

  const refetch = async () => {
    if (!user) return;
    const { data } = await supabase.from("podcasts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems((data ?? []) as Podcast[]);
  };
  useEffect(() => { refetch(); }, [user]);

  const pickTemplate = (id: TemplateId) => {
    setTemplate(id);
    setPickerOpen(false);
    setWizardOpen(true);
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] relative">
      <TabNav active="Podcast" />

      <div className="max-w-6xl mx-auto px-6 pt-8 pb-32">
        <div className="grid md:grid-cols-[360px_1fr] items-center gap-8 mb-8">
          <img src={podcastIllustration} alt="Two stick figures podcasting" className="w-full max-w-[360px] object-contain" loading="lazy" />
          <div className="flex items-end justify-between gap-6">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight">On the mic.</h1>
              <p className="text-sm text-foreground/60 mt-1">{items.length} episode{items.length === 1 ? "" : "s"} drafted</p>
            </div>
            <ViewToggle value={view} onChange={setView} />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 text-foreground/50">
            <Mic className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <div className="font-serif text-2xl mb-1">No episodes yet</div>
            <p className="text-sm">Tap the + button to pick a show template.</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p, i) => (
              <div key={p.id} className="relative group">
                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ItemOverflowMenu kind="podcast" item={p} table="podcasts" onDeleted={refetch} />
                </div>
                <button onClick={() => setSelected(p)} className="w-full text-left rounded-3xl bg-background/80 border border-foreground/10 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5">
                  <div className={`h-32 ${COVERS[i % COVERS.length]} flex items-end p-4`}>
                    <div className="text-background/90 text-xs uppercase tracking-widest">{p.show_name}</div>
                  </div>
                  <div className="p-5">
                    <div className="font-serif text-xl leading-tight line-clamp-2">{p.episode_title}</div>
                    <p className="text-xs text-foreground/60 mt-2 line-clamp-2">{p.payload?.logline ?? p.topic ?? "—"}</p>
                    <div className="text-[10px] text-foreground/50 mt-3 uppercase tracking-widest">
                      {p.payload?.template ?? p.format} · {p.length}
                    </div>
                  </div>
                </button>
              </div>
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
                    <div className="text-xs text-foreground/50 truncate">{p.show_name} · {p.payload?.template ?? p.format}</div>
                  </div>
                  <span className="text-xs text-foreground/50">{new Date(p.created_at).toLocaleDateString()}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative z-10 flex justify-center mt-16 mb-20">
        <CloudAddButton onClick={() => setPickerOpen(true)} label="New podcast" />
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Pick a show template</DialogTitle>
            <DialogDescription>Choose the vibe — we'll seed the wizard with the right format and tone.</DialogDescription>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3 py-2">
            {TEMPLATES.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => pickTemplate(t.id)}
                  className="text-left p-5 rounded-2xl border border-foreground/10 hover:bg-foreground/5 hover:border-foreground/30 transition">
                  <Icon className="h-5 w-5 mb-2 text-foreground/70" />
                  <div className="font-serif text-lg">{t.label}</div>
                  <p className="text-xs text-foreground/60 mt-1">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          {selected && <PodcastView p={selected} />}
        </DialogContent>
      </Dialog>

      <PodcastWizard
        open={wizardOpen}
        template={template}
        onOpenChange={(v) => { setWizardOpen(v); if (!v) setTemplate(null); }}
        onSaved={() => refetch()}
      />
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
    </div>
  );
}

function PodcastWizard({ open, template, onOpenChange, onSaved }: {
  open: boolean; template: TemplateId | null;
  onOpenChange: (v: boolean) => void; onSaved: () => void;
}) {
  const tmpl = TEMPLATES.find((t) => t.id === template);
  const [step, setStep] = useState(0);
  const [showName, setShowName] = useState("");
  const [topic, setTopic] = useState("");
  const [length, setLength] = useState("20 minutes");
  const [storyIds, setStoryIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!open) { setStep(0); setStoryIds([]); } }, [open]);

  const submit = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("podcast-builder", {
      body: {
        show_name: showName,
        topic,
        format: tmpl?.format ?? "solo narrative",
        tone: tmpl?.tone,
        template: tmpl?.id,
        length,
        story_ids: storyIds,
      },
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
    { label: "Length", node: (
      <div className="space-y-2"><Label>Target length</Label>
        <Input value={length} onChange={(e) => setLength(e.target.value)} /></div>
    )},
    { label: "Pull stories", node: (
      <StoryPicker
        purpose="podcast"
        context={`Show: ${showName}\nTopic: ${topic}\nFormat: ${tmpl?.format}\nTone: ${tmpl?.tone}\nLength: ${length}`}
        selected={storyIds}
        onChange={setStoryIds}
      />
    )},
  ];


  const isLast = step === steps.length - 1;
  const canNext = step !== 0 || showName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="text-xs uppercase tracking-widest text-foreground/50">{tmpl?.label ?? "Podcast"} template</div>
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
