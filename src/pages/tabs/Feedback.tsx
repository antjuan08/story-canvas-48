import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, Sparkles, BookmarkPlus, Crown, Megaphone, MessageSquare, BookOpen, Headphones, Church, Coffee } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type Mode = "idle" | "recording" | "scoring" | "done";

const PERSONAS = [
  { id: "ceo", label: "CEO", icon: Crown, blurb: "Executive presence & conviction" },
  { id: "public_speaker", label: "Public Speaker", icon: Megaphone, blurb: "TED-level stage craft" },
  { id: "communicator", label: "Communicator", icon: MessageSquare, blurb: "Clear, accessible, inclusive" },
  { id: "storyteller", label: "Storyteller", icon: BookOpen, blurb: "Narrative arc & emotion" },
] as const;

const CONTEXTS = [
  { id: "keynote", label: "Keynote", icon: Megaphone },
  { id: "podcast", label: "Podcast", icon: Headphones },
  { id: "sermon", label: "Sermon", icon: Church },
  { id: "casual", label: "Coffee chat", icon: Coffee },
] as const;

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)) as any);
  }
  return btoa(bin);
}

export default function Feedback() {
  const { user } = useAuth();
  const [persona, setPersona] = useState<typeof PERSONAS[number]["id"]>("storyteller");
  const [context, setContext] = useState<typeof CONTEXTS[number]["id"]>("keynote");
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<Mode>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [savedIdx, setSavedIdx] = useState<Set<number>>(new Set());
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);

  useEffect(() => () => {
    try { mrRef.current?.stream?.getTracks().forEach((t) => t.stop()); } catch {}
    if (tickRef.current) clearInterval(tickRef.current);
  }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mime = candidates.find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t)) || "";
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
        setMode("scoring");
        const type = mr.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        try {
          const base64 = await blobToBase64(blob);
          const { data, error } = await supabase.functions.invoke("speech-feedback", {
            body: { audioBase64: base64, mimeType: type, topic, persona, context },
          });
          if (error || data?.error) throw new Error(data?.error ?? error?.message ?? "Failed");
          setTranscript(data.transcript ?? "");
          setFeedback(data.feedback ?? {});
          setSavedIdx(new Set());
          setMode("done");
        } catch (e: any) {
          toast.error(e.message ?? "Coaching failed");
          setMode("idle");
        }
      };
      mrRef.current = mr;
      mr.start(250);
      setElapsed(0);
      setMode("recording");
      tickRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      toast.error("Could not access microphone");
    }
  };

  const stop = () => { try { mrRef.current?.stop(); } catch {} };

  const saveStory = async (idx: number, s: any) => {
    if (!user) { toast.error("Sign in to save"); return; }
    const { error } = await supabase.from("stories").insert({
      user_id: user.id,
      title: s.title || "Untitled",
      body: s.body || s.hook || "",
      category: s.theme || null,
      tags: Array.isArray(s.tags) ? s.tags : [],
    });
    if (error) { toast.error(error.message); return; }
    setSavedIdx((prev) => new Set(prev).add(idx));
    toast.success("Saved to your stories");
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <header>
        <h1 className="font-serif text-4xl md:text-5xl">Feedback</h1>
        <p className="text-foreground/60 mt-2">Record any talk and your AI coach will rate it — and pull out the stories worth keeping.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-foreground/50">Pick your coach</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            const active = persona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  active ? "border-foreground bg-foreground/5" : "border-foreground/10 hover:border-foreground/30"
                )}
              >
                <Icon className="h-5 w-5 mb-2" />
                <div className="font-medium">{p.label}</div>
                <div className="text-xs text-foreground/60 mt-1">{p.blurb}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-foreground/50">What are you doing?</h2>
        <div className="flex flex-wrap gap-2">
          {CONTEXTS.map((c) => {
            const Icon = c.icon;
            const active = context === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setContext(c.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                  active ? "border-foreground bg-foreground text-background" : "border-foreground/15 hover:border-foreground/40"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-foreground/50">Topic <span className="normal-case text-foreground/40">(optional)</span></h2>
        <Input
          placeholder="e.g. Q3 all-hands, sermon on grace, podcast intro…"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </section>

      <Card className="p-8 flex flex-col items-center gap-4 rounded-3xl">
        {mode === "idle" && (
          <>
            <Button onClick={start} size="lg" className="rounded-full px-8">
              <Mic className="h-4 w-4 mr-2" /> Start recording
            </Button>
            <p className="text-xs text-foreground/50">Tap stop when you're done. Even 30 seconds works.</p>
          </>
        )}
        {mode === "recording" && (
          <>
            <div className="flex items-center gap-2">
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-sm font-medium">Recording</span>
              <span className="text-sm tabular-nums text-foreground/60">{mm}:{ss}</span>
            </div>
            <Button onClick={stop} size="lg" className="rounded-full px-8">
              <Square className="h-3.5 w-3.5 mr-2 fill-current" /> Stop &amp; coach me
            </Button>
          </>
        )}
        {mode === "scoring" && (
          <div className="py-8 flex flex-col items-center gap-3 text-foreground/70">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Coaching &amp; extracting stories…</span>
          </div>
        )}
      </Card>

      {mode === "done" && feedback && (
        <div className="space-y-8">
          <Card className="p-6 rounded-3xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> Your coach says
              </h3>
              {feedback.overall_grade && (
                <div className="rounded-full bg-foreground text-background w-12 h-12 flex items-center justify-center font-serif text-2xl">
                  {feedback.overall_grade}
                </div>
              )}
            </div>
            {feedback.scores && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {Object.entries(feedback.scores).map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-foreground/5 p-3 text-center">
                    <div className="text-2xl font-serif">{String(v)}</div>
                    <div className="text-[10px] uppercase tracking-widest text-foreground/50 mt-1">{k.replace(/_/g, " ")}</div>
                  </div>
                ))}
              </div>
            )}
            {feedback.summary && <p className="font-serif text-base italic leading-relaxed">{feedback.summary}</p>}
            <div className="grid md:grid-cols-2 gap-6">
              {Array.isArray(feedback.strengths) && feedback.strengths.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-foreground/50 mb-2">Strengths</h4>
                  <ul className="space-y-1 text-sm list-disc pl-5">
                    {feedback.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {Array.isArray(feedback.improvements) && feedback.improvements.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-foreground/50 mb-2">Try next time</h4>
                  <ul className="space-y-1 text-sm list-disc pl-5">
                    {feedback.improvements.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
            {feedback.suggested_rewrite && (
              <div className="border-t border-foreground/10 pt-4">
                <h4 className="text-xs uppercase tracking-widest text-foreground/50 mb-2">Try opening with</h4>
                <p className="font-serif italic">"{feedback.suggested_rewrite}"</p>
              </div>
            )}
          </Card>

          {Array.isArray(feedback.extracted_stories) && feedback.extracted_stories.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-serif text-2xl">Stories worth keeping</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {feedback.extracted_stories.map((s: any, i: number) => (
                  <Card key={i} className="p-5 rounded-2xl space-y-3">
                    <div>
                      <div className="font-serif text-lg">{s.title}</div>
                      {s.hook && <div className="text-sm text-foreground/60 italic">{s.hook}</div>}
                    </div>
                    {s.body && <p className="text-sm leading-relaxed">{s.body}</p>}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex flex-wrap gap-1.5">
                        {s.theme && <span className="text-[10px] uppercase tracking-widest text-foreground/50">{s.theme}</span>}
                      </div>
                      <Button
                        size="sm"
                        variant={savedIdx.has(i) ? "secondary" : "default"}
                        onClick={() => saveStory(i, s)}
                        disabled={savedIdx.has(i)}
                        className="rounded-full"
                      >
                        <BookmarkPlus className="h-3.5 w-3.5 mr-1.5" />
                        {savedIdx.has(i) ? "Saved" : "Save story"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {transcript && (
            <details className="text-sm text-foreground/60">
              <summary className="cursor-pointer">View transcript</summary>
              <p className="mt-2 whitespace-pre-wrap">{transcript}</p>
            </details>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setMode("idle"); setFeedback(null); setTranscript(""); }}>
              Record another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
