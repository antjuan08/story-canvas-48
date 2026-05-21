import { useState } from "react";
import { FileText, Sparkles, Trash2, Download, Loader2, Pencil, FolderInput, BookOpenText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Recording } from "@/hooks/use-recordings";
import type { Folder } from "@/hooks/use-stories";
import { useAuth } from "@/hooks/use-auth";

function fmt(s?: number | null) {
  if (!s) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

async function urlToBase64(url: string): Promise<{ base64: string; mime: string }> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = r.result as string;
      const [meta, b64] = dataUrl.split(",");
      const m = /data:([^;]+);base64/.exec(meta);
      resolve({ base64: b64, mime: m?.[1] ?? blob.type });
    };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

interface Props {
  rec: Recording;
  folders: Folder[];
  onChanged: () => void;
}

export function RecordingCard({ rec, folders, onChanged }: Props) {
  const { user } = useAuth();
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(rec.title);
  const [transcribing, setTranscribing] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyMd, setStoryMd] = useState<string>("");

  const analysis = (rec.analysis ?? {}) as { transcript?: string; story?: string };

  const url = rec.audio_url || rec.video_url || "";

  const save = async (updates: Partial<Recording>) => {
    const { error } = await supabase.from("recordings").update(updates).eq("id", rec.id);
    if (error) return toast.error(error.message);
    onChanged();
  };

  const remove = async () => {
    if (!confirm("Delete this recording?")) return;
    const { error } = await supabase.from("recordings").delete().eq("id", rec.id);
    if (error) return toast.error(error.message);
    toast.success("Recording deleted");
    onChanged();
  };

  const rename = async () => {
    setRenaming(false);
    if (title.trim() && title !== rec.title) {
      await save({ title: title.trim() });
      toast.success("Renamed");
    }
  };

  const transcribe = async () => {
    if (!url) return toast.error("No audio file");
    try {
      setTranscribing(true);
      const { base64, mime } = await urlToBase64(url);
      const { data, error } = await supabase.functions.invoke("audio-ai", {
        body: { action: "transcribe", audioBase64: base64, mimeType: mime },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await save({ analysis: { ...analysis, transcript: data.transcript || "" } });
      toast.success("Transcript ready");
    } catch (e: any) {
      toast.error(e?.message || "Transcription failed");
    } finally {
      setTranscribing(false);
    }
  };

  const rewriteStory = async () => {
    if (!analysis.transcript) return toast.error("Transcribe first");
    try {
      setRewriting(true);
      const { data, error } = await supabase.functions.invoke("audio-ai", {
        body: { action: "rewrite", transcript: analysis.transcript },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await save({ analysis: { ...analysis, story: data.story || "" } });
      setStoryMd(data.story || "");
      setStoryOpen(true);
    } catch (e: any) {
      toast.error(e?.message || "Story rewrite failed");
    } finally {
      setRewriting(false);
    }
  };

  const saveAsStory = async () => {
    if (!user) return;
    const text = analysis.story || analysis.transcript;
    if (!text) return toast.error("Transcribe or rewrite first");
    const { data, error } = await supabase
      .from("stories")
      .insert({
        user_id: user.id,
        title: rec.title,
        body: text,
        audio_url: rec.audio_url,
        section: "vault",
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    if (data) {
      await supabase.from("recordings").update({ linked_story_id: data.id }).eq("id", rec.id);
      toast.success("Saved to The Vault");
      onChanged();
    }
  };

  return (
    <>
      <div className="glass-card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {renaming ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={rename}
                onKeyDown={(e) => e.key === "Enter" && rename()}
                autoFocus
                className="h-8"
              />
            ) : (
              <p className="font-medium truncate" onDoubleClick={() => setRenaming(true)}>
                {rec.title}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {new Date(rec.created_at).toLocaleString()} · {fmt(rec.duration_seconds)}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRenaming(true)}>Rename</DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderInput className="h-4 w-4 mr-2" /> Move to folder
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => save({ folder_id: null })}>No folder</DropdownMenuItem>
                    {folders.map((f) => (
                      <DropdownMenuItem key={f.id} onClick={() => save({ folder_id: f.id })}>
                        {f.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={saveAsStory}>
                  <BookOpenText className="h-4 w-4 mr-2" /> Save as Story
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={remove}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <a href={url} download={`${rec.title}.webm`}>
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {url && <audio src={url} controls className="w-full" />}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={transcribe} disabled={transcribing}>
            {transcribing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            {analysis.transcript ? "Re-transcribe" : "Transcribe"}
          </Button>
          <Button
            size="sm"
            className="rounded-xl gap-1.5 bg-gradient-primary text-white hover:opacity-90"
            onClick={rewriteStory}
            disabled={rewriting}
          >
            {rewriting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Rewrite as Story
          </Button>
          {analysis.story && (
            <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => { setStoryMd(analysis.story!); setStoryOpen(true); }}>
              View Story
            </Button>
          )}
        </div>

        {analysis.transcript && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Transcript</summary>
            <p className="mt-2 whitespace-pre-wrap text-foreground/80">{analysis.transcript}</p>
          </details>
        )}

        <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
          ✨ AI Analysis (tone, pacing, emotion) — <span className="italic">Coming soon</span>
        </div>
      </div>

      <Dialog open={storyOpen} onOpenChange={setStoryOpen}>
        <DialogContent className="max-w-2xl glass-card">
          <DialogHeader>
            <DialogTitle className="text-gradient-primary">Your Story</DialogTitle>
            <DialogDescription>AI-rewritten storytelling version of your recording.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">{storyMd}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStoryOpen(false)} className="rounded-xl">Close</Button>
            <Button onClick={saveAsStory} className="rounded-xl gap-1.5 bg-gradient-primary text-white hover:opacity-90">
              Save to Vault
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
