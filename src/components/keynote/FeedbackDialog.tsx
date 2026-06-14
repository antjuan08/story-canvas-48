import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Mode = "idle" | "recording" | "scoring" | "done";

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)) as any);
  }
  return btoa(bin);
}

export function FeedbackDialog({
  open, onOpenChange, topic,
}: { open: boolean; onOpenChange: (v: boolean) => void; topic?: string }) {
  const [mode, setMode] = useState<Mode>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setMode("idle"); setElapsed(0); setTranscript(""); setFeedback(null);
      try { mrRef.current?.stream?.getTracks().forEach((t) => t.stop()); } catch {}
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    }
  }, [open]);

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
            body: { audioBase64: base64, mimeType: type, topic },
          });
          if (error || data?.error) throw new Error(data?.error ?? error?.message ?? "Failed");
          setTranscript(data.transcript ?? "");
          setFeedback(data.feedback ?? {});
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
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Feedback
          </DialogTitle>
          <DialogDescription>
            Record yourself delivering your speech. AI will transcribe and coach you on pacing, clarity, energy, and structure.
          </DialogDescription>
        </DialogHeader>

        {mode === "idle" && (
          <div className="py-8 flex flex-col items-center gap-4">
            <Button onClick={start} size="lg" className="rounded-full">
              <Mic className="h-4 w-4 mr-2" /> Start recording
            </Button>
            <p className="text-xs text-foreground/50">A short rehearsal works best — even 30 seconds.</p>
          </div>
        )}

        {mode === "recording" && (
          <div className="py-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-sm font-medium">Recording</span>
              <span className="text-sm tabular-nums text-foreground/60">{mm}:{ss}</span>
            </div>
            <Button onClick={stop} className="rounded-full">
              <Square className="h-3.5 w-3.5 mr-2 fill-current" /> Stop &amp; score
            </Button>
          </div>
        )}

        {mode === "scoring" && (
          <div className="py-12 flex flex-col items-center gap-3 text-foreground/70">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Coaching…</span>
          </div>
        )}

        {mode === "done" && feedback && (
          <div className="space-y-5 py-2">
            {feedback.scores && (
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(feedback.scores).map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-foreground/5 p-3 text-center">
                    <div className="text-2xl font-serif">{String(v)}</div>
                    <div className="text-[10px] uppercase tracking-widest text-foreground/50 mt-1">{k.replace(/_/g, " ")}</div>
                  </div>
                ))}
              </div>
            )}
            {feedback.summary && <p className="font-serif text-base italic leading-relaxed">{feedback.summary}</p>}
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
            {feedback.suggested_rewrite && (
              <div className="border-t border-foreground/10 pt-4">
                <h4 className="text-xs uppercase tracking-widest text-foreground/50 mb-2">Suggested opening line</h4>
                <p className="font-serif italic">"{feedback.suggested_rewrite}"</p>
              </div>
            )}
            {transcript && (
              <details className="text-xs text-foreground/60">
                <summary className="cursor-pointer">View transcript</summary>
                <p className="mt-2 whitespace-pre-wrap">{transcript}</p>
              </details>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => { setMode("idle"); setFeedback(null); setTranscript(""); }}>
                Record again
              </Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
