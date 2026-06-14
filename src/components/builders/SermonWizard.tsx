import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { StoryPicker } from "@/components/builders/StoryPicker";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: (k: any) => void;
}

export function SermonWizard({ open, onOpenChange, onSaved }: Props) {
  const [step, setStep] = useState(0);
  const [scripture, setScripture] = useState("");
  const [congregation, setCongregation] = useState("");
  const [bigIdea, setBigIdea] = useState("");
  const [length, setLength] = useState("25 minutes");
  const [storyIds, setStoryIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!open) { setStep(0); setStoryIds([]); } }, [open]);

  const submit = async () => {
    setBusy(true);
    const audience = `Congregation: ${congregation || "general"}`;
    const core_message = `Scripture: ${scripture}\nBig idea: ${bigIdea}\nShape it as a sermon (hook → text → exposition → application → call).`;
    const { data, error } = await supabase.functions.invoke("keynote-builder", {
      body: { audience, core_message, tone: "warm, pastoral, scripturally grounded", length, story_ids: storyIds, template: "sermon" },
    });
    setBusy(false);
    if (error || data?.error) { toast.error(data?.error ?? error?.message ?? "Failed"); return; }
    toast.success("Sermon outline built");
    onSaved?.(data.keynote);
    onOpenChange(false);
  };

  const steps = [
    { label: "Scripture", node: (
      <div className="space-y-2"><Label>Scripture or passage</Label>
        <Input value={scripture} onChange={(e) => setScripture(e.target.value)} placeholder="Luke 15:11-32 — Prodigal Son" /></div>
    )},
    { label: "Congregation", node: (
      <div className="space-y-2"><Label>Who's listening?</Label>
        <Input value={congregation} onChange={(e) => setCongregation(e.target.value)} placeholder="Sunday morning · mixed ages" /></div>
    )},
    { label: "Big idea", node: (
      <div className="space-y-2"><Label>The one truth they leave with</Label>
        <Textarea value={bigIdea} onChange={(e) => setBigIdea(e.target.value)} rows={3} placeholder="The Father runs to the one who returns." /></div>
    )},
    { label: "Length", node: (
      <div className="space-y-2"><Label>Length</Label>
        <Input value={length} onChange={(e) => setLength(e.target.value)} /></div>
    )},
    { label: "Stories", node: (
      <StoryPicker purpose="keynote" context={`Sermon · ${scripture}\nBig idea: ${bigIdea}`} selected={storyIds} onChange={setStoryIds} />
    )},
  ];
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{steps[step].label}</DialogTitle>
          <DialogDescription>Sermon · Step {step + 1} of {steps.length}</DialogDescription>
        </DialogHeader>
        <div className="py-2">{steps[step].node}</div>
        <DialogFooter>
          {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={busy}>Back</Button>}
          {!isLast ? (
            <Button onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <Button onClick={submit} disabled={busy}>
              {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Writing…</> : <><Sparkles className="h-4 w-4 mr-2" />Build sermon</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
