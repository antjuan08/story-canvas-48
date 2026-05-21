import { useState } from "react";
import { FileText, Sparkles, Trash2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Recording, useRecordingsStore } from "@/stores/recordingsStore";
import { StoryDialog } from "./StoryDialog";
import { supabase } from "@/integrations/supabase/client";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function dataUrlToBase64(url: string): { base64: string; mime: string } {
  const [meta, b64] = url.split(",");
  const m = /data:([^;]+);base64/.exec(meta);
  return { base64: b64, mime: m?.[1] ?? "audio/webm" };
}

export function RecordingCard({ rec }: { rec: Recording }) {
  const { remove, setTranscript, setStory } = useRecordingsStore();
  const [open, setOpen] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [rewriting, setRewriting] = useState(false);

  const transcribe = async () => {
    try {
      setTranscribing(true);
      const { base64, mime } = dataUrlToBase64(rec.url);
      const { data, error } = await supabase.functions.invoke("audio-ai", {
        body: { action: "transcribe", audioBase64: base64, mimeType: mime },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTranscript(rec.id, data.transcript || "(empty transcript)");
      toast.success("Transcript ready");
    } catch (e: any) {
      toast.error(e?.message || "Transcription failed");
    } finally {
      setTranscribing(false);
    }
  };

  const rewriteStory = async () => {
    if (!rec.transcript) {
      toast.error("Transcribe the recording first");
      return;
    }
    try {
      setRewriting(true);
      const { data, error } = await supabase.functions.invoke("audio-ai", {
        body: { action: "rewrite", transcript: rec.transcript },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setStory(rec.id, data.story || "");
      setOpen(true);
    } catch (e: any) {
      toast.error(e?.message || "Story rewrite failed");
    } finally {
      setRewriting(false);
    }
  };

  return (
    <>
      <div className="glass-card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium truncate">{rec.name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(rec.createdAt).toLocaleString()} · {fmt(rec.duration)}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <a href={rec.url} download={`${rec.name}.webm`}><Download className="h-4 w-4" /></a>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(rec.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <audio src={rec.url} controls className="w-full" />

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={transcribe} disabled={transcribing}>
            {transcribing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            {rec.transcript ? "Re-transcribe" : "Transcribe"}
          </Button>
          <Button size="sm" className="rounded-xl gap-1.5 bg-gradient-primary text-white hover:opacity-90" onClick={rewriteStory} disabled={rewriting}>
            {rewriting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Rewrite as Story
          </Button>
        </div>

        {rec.transcript && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Transcript</summary>
            <p className="mt-2 whitespace-pre-wrap text-foreground/80">{rec.transcript}</p>
          </details>
        )}
      </div>

      <StoryDialog open={open} onOpenChange={setOpen} rec={rec} />
    </>
  );
}
