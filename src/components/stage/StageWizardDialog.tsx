import { useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, BookOpen, Mic2, Headphones, Church } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useStageArchitect, type StageBrief } from "@/hooks/use-stage-architect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (presentationId: string) => void;
}

const TEMPLATES = [
  { value: "sermon", label: "Sermon", icon: Church, desc: "Scripture, message, call to action." },
  { value: "keynote", label: "Keynote", icon: Mic2, desc: "Hook, narrative arc, big idea." },
  { value: "podcast", label: "Podcast", icon: Headphones, desc: "Intro, segments, outro." },
  { value: "book", label: "Book", icon: BookOpen, desc: "Chapters built from your stories." },
] as const;

const DYNAMIC_OPTIONS = [
  "Inspirational", "Funny", "Reverent", "Bold", "Tender",
  "Data-driven", "Story-driven", "Provocative", "Practical", "Poetic",
];

const STEPS = [
  "Template", "Title", "Topic", "Audience", "Outcome",
  "Tone", "Pain points", "Big idea", "Length", "Review",
] as const;

export function StageWizardDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const { generate, generating } = useStageArchitect();
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<StageBrief>({
    title: "",
    template_type: "keynote",
    topic: "",
    audience: "",
    outcome: "",
    dynamics: [],
    pain_points: "",
    solution: "",
    length_minutes: 20,
  });

  const reset = () => {
    setStep(0);
    setBrief({
      title: "", template_type: "keynote", topic: "", audience: "", outcome: "",
      dynamics: [], pain_points: "", solution: "", length_minutes: 20,
    });
  };

  const close = () => { onOpenChange(false); setTimeout(reset, 300); };

  const canAdvance = () => {
    switch (step) {
      case 0: return !!brief.template_type;
      case 1: return brief.title.trim().length > 0;
      case 2: return brief.topic.trim().length > 0;
      case 3: return brief.audience.trim().length > 0;
      case 4: return brief.outcome.trim().length > 0;
      case 5: return brief.dynamics.length > 0;
      case 6: return brief.pain_points.trim().length > 0;
      case 7: return brief.solution.trim().length > 0;
      default: return true;
    }
  };

  const next = () => {
    if (!canAdvance()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const toggleDynamic = (d: string) => {
    setBrief((b) => ({
      ...b,
      dynamics: b.dynamics.includes(d) ? b.dynamics.filter((x) => x !== d) : [...b.dynamics, d],
    }));
  };

  const handleBuild = async () => {
    if (!user) return;
    const result = await generate(brief);
    if (!result) return;

    const { plan } = result;
    const tags = Array.from(new Set([...(plan.suggested_tags ?? []), ...brief.dynamics])).slice(0, 20);

    const { data: pres, error: insErr } = await supabase
      .from("presentations")
      .insert({
        user_id: user.id,
        title: brief.title.trim(),
        template_type: brief.template_type,
        tags,
        content: {
          brief,
          summary: plan.summary,
          outline: plan.outline,
          generated_at: new Date().toISOString(),
          model: "google/gemini-3-flash-preview",
        },
      })
      .select("id")
      .single();

    if (insErr || !pres) {
      toast.error(insErr?.message ?? "Could not save presentation");
      return;
    }

    // Insert story links
    const links: { presentation_id: string; story_id: string; position: number }[] = [];
    let pos = 0;
    for (const section of plan.outline) {
      for (const sid of section.story_ids ?? []) {
        links.push({ presentation_id: pres.id, story_id: sid, position: pos++ });
      }
    }
    if (links.length > 0) {
      await supabase.from("presentation_stories").insert(links);
    }

    toast.success("Your presentation is ready");
    onCreated(pres.id);
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Progress */}
        <div className="px-6 pt-6">
          <div className="flex items-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-apple",
                  i <= step ? "bg-primary" : "bg-secondary",
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-1">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
        </div>

        <div className="px-6 pb-6 min-h-[340px]">
          {generating ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative">
                <Sparkles className="h-12 w-12 text-primary animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold mt-4">Curating stories from your vault…</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Weaving your brief into a {brief.template_type} outline.
              </p>
            </div>
          ) : (
            <>
              {step === 0 && (
                <Step title="What are you building?" subtitle="Pick a format to shape the outline.">
                  <div className="grid grid-cols-2 gap-3">
                    {TEMPLATES.map((t) => {
                      const Icon = t.icon;
                      const active = brief.template_type === t.value;
                      return (
                        <button
                          key={t.value}
                          onClick={() => setBrief((b) => ({ ...b, template_type: t.value }))}
                          className={cn(
                            "text-left rounded-2xl border p-4 transition-apple",
                            active ? "border-primary bg-primary-soft shadow-apple-sm" : "border-border hover:bg-accent",
                          )}
                        >
                          <Icon className="h-5 w-5 text-primary mb-2" />
                          <div className="font-semibold">{t.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </Step>
              )}

              {step === 1 && (
                <Step title="What's the working title?" subtitle="You can change it later.">
                  <Input
                    autoFocus
                    value={brief.title}
                    onChange={(e) => setBrief((b) => ({ ...b, title: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && next()}
                    placeholder="e.g. The Suspected Double Agent"
                    className="rounded-2xl text-lg py-6"
                  />
                </Step>
              )}

              {step === 2 && (
                <Step title="What's the topic?" subtitle="A sentence or two on the subject.">
                  <Textarea
                    autoFocus
                    rows={4}
                    value={brief.topic}
                    onChange={(e) => setBrief((b) => ({ ...b, topic: e.target.value }))}
                    placeholder="Trust, betrayal, and the long road back…"
                    className="rounded-2xl"
                  />
                </Step>
              )}

              {step === 3 && (
                <Step title="Who is it for?" subtitle="Describe the audience.">
                  <Input
                    autoFocus
                    value={brief.audience}
                    onChange={(e) => setBrief((b) => ({ ...b, audience: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && next()}
                    placeholder="Founders, churchgoers, podcast listeners…"
                    className="rounded-2xl text-lg py-6"
                  />
                </Step>
              )}

              {step === 4 && (
                <Step title="Desired outcome?" subtitle="What should they think, feel, or do after?">
                  <Textarea
                    autoFocus
                    rows={4}
                    value={brief.outcome}
                    onChange={(e) => setBrief((b) => ({ ...b, outcome: e.target.value }))}
                    placeholder="Walk away with one clear next step…"
                    className="rounded-2xl"
                  />
                </Step>
              )}

              {step === 5 && (
                <Step title="What's the tone?" subtitle="Pick all that apply.">
                  <div className="flex flex-wrap gap-2">
                    {DYNAMIC_OPTIONS.map((d) => {
                      const active = brief.dynamics.includes(d);
                      return (
                        <button
                          key={d}
                          onClick={() => toggleDynamic(d)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium transition-apple",
                            active ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent",
                          )}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </Step>
              )}

              {step === 6 && (
                <Step title="What pain points are you addressing?" subtitle="The struggle you're naming.">
                  <Textarea
                    autoFocus
                    rows={4}
                    value={brief.pain_points}
                    onChange={(e) => setBrief((b) => ({ ...b, pain_points: e.target.value }))}
                    placeholder="The hidden cost of unspoken doubt…"
                    className="rounded-2xl"
                  />
                </Step>
              )}

              {step === 7 && (
                <Step title="What's your big idea / solution?" subtitle="The through-line.">
                  <Textarea
                    autoFocus
                    rows={4}
                    value={brief.solution}
                    onChange={(e) => setBrief((b) => ({ ...b, solution: e.target.value }))}
                    placeholder="Name the agent. Trust again on purpose."
                    className="rounded-2xl"
                  />
                </Step>
              )}

              {step === 8 && (
                <Step
                  title={brief.template_type === "book" ? "How many chapters?" : "How long?"}
                  subtitle={brief.template_type === "book" ? "Rough chapter count." : "Target length in minutes."}
                >
                  <div className="pt-2">
                    <Slider
                      value={[brief.length_minutes]}
                      min={brief.template_type === "book" ? 3 : 5}
                      max={brief.template_type === "book" ? 30 : 90}
                      step={1}
                      onValueChange={(v) => setBrief((b) => ({ ...b, length_minutes: v[0] }))}
                    />
                    <div className="text-center text-2xl font-semibold mt-4">
                      {brief.length_minutes} {brief.template_type === "book" ? "chapters" : "min"}
                    </div>
                  </div>
                </Step>
              )}

              {step === 9 && (
                <Step title="Ready to build" subtitle="AI will weave your stories into an outline.">
                  <div className="space-y-2 text-sm">
                    <Row k="Format" v={brief.template_type} />
                    <Row k="Title" v={brief.title} />
                    <Row k="Topic" v={brief.topic} />
                    <Row k="Audience" v={brief.audience} />
                    <Row k="Outcome" v={brief.outcome} />
                    <Row k="Tone" v={brief.dynamics.join(", ")} />
                    <Row k="Pain" v={brief.pain_points} />
                    <Row k="Big idea" v={brief.solution} />
                    <Row k="Length" v={`${brief.length_minutes} ${brief.template_type === "book" ? "chapters" : "min"}`} />
                  </div>
                </Step>
              )}
            </>
          )}
        </div>

        {!generating && (
          <div className="border-t bg-muted/30 px-6 py-3 flex items-center justify-between">
            <Button variant="ghost" onClick={back} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button className="bg-gradient-primary" onClick={next} disabled={!canAdvance()}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button className="bg-gradient-primary" onClick={handleBuild} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                Build it
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-muted-foreground w-20 shrink-0">{k}</span>
      <span className="flex-1 break-words">{v || <span className="text-muted-foreground italic">—</span>}</span>
    </div>
  );
}
