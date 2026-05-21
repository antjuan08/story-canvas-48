import { useState } from "react";
import { FileText, Sparkles, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Recording, useRecordingsStore } from "@/stores/recordingsStore";
import { StoryDialog } from "./StoryDialog";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function RecordingCard({ rec }: { rec: Recording }) {
  const { remove, setTranscript, setStory } = useRecordingsStore();
  const [open, setOpen] = useState(false);

  const transcribe = () => {
    // Stub transcription — real STT requires Lovable Cloud + AI Gateway.
    const mock = `[Demo transcript for "${rec.name}"]\n\nThis is a placeholder transcript. Enable Lovable Cloud to wire real speech-to-text, then this button will return your actual words.`;
    setTranscript(rec.id, mock);
  };

  const rewriteStory = () => {
    const base = rec.transcript ?? "(no transcript yet — generating from audio metadata)";
    const story = `Once upon a recording made on ${new Date(rec.createdAt).toLocaleDateString()}, a voice spoke into the void of ${fmt(rec.duration)} of silence-broken air.\n\n${base}\n\nAnd so the moment, captured and reshaped, became a story worth keeping.`;
    setStory(rec.id, story);
    setOpen(true);
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
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={transcribe}>
            <FileText className="h-3.5 w-3.5" />
            {rec.transcript ? "Re-transcribe" : "Transcribe"}
          </Button>
          <Button size="sm" className="rounded-xl gap-1.5 bg-gradient-primary text-white hover:opacity-90" onClick={rewriteStory}>
            <Sparkles className="h-3.5 w-3.5" />
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
