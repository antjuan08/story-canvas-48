import { useRef, useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { MicOrb } from "@/components/record/MicOrb";
import { RecordingCard } from "@/components/recordings/RecordingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useFolders } from "@/hooks/use-stories";
import { useRecordings, uploadRecording } from "@/hooks/use-recordings";
import { supabase } from "@/integrations/supabase/client";

export function Recordings() {
  const { user } = useAuth();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);

  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const { folders, refetch: refetchFolders } = useFolders("recordings");
  const { recordings, refetch } = useRecordings(activeFolder);

  const filtered = useMemo(
    () => recordings.filter((r) => r.title.toLowerCase().includes(search.toLowerCase())),
    [recordings, search]
  );

  const newFolder = async () => {
    const name = prompt("New folder name");
    if (!name?.trim() || !user) return;
    const { error } = await supabase.from("folders").insert({ user_id: user.id, name: name.trim(), context: "recordings" });
    if (error) return toast.error(error.message);
    refetchFolders();
  };

  const start = async () => {
    if (!user) return toast.error("Sign in first");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/ogg;codecs=opus"];
      const mimeType = candidates.find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t)) || "";
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const type = mr.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const duration = Math.round((Date.now() - startRef.current) / 1000);
        try {
          const ext = type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : "webm";
          const publicUrl = await uploadRecording(user.id, blob, ext);
          const { error } = await supabase.from("recordings").insert({
            user_id: user.id,
            title: `Recording ${new Date().toLocaleString()}`,
            audio_url: publicUrl,
            duration_seconds: duration,
            folder_id: activeFolder,
          });
          if (error) throw error;
          toast.success("Recording saved to your account");
          refetch();
        } catch (e: any) {
          toast.error(e?.message || "Upload failed");
        }
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      startRef.current = Date.now();
      mr.start(250);
      setRecording(true);
      setElapsed(0);
      tickRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch {
      toast.error("Could not access microphone");
    }
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (tickRef.current) window.clearInterval(tickRef.current);
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recordings</h1>
        <p className="text-muted-foreground mt-1">
          Record your voice, save it to your account, transcribe it, then let AI rewrite it as a story.
        </p>
      </div>

      <div className="glass-card p-10 flex flex-col items-center gap-6">
        <MicOrb recording={recording} onToggle={recording ? stop : start} />
        <div className="text-center">
          <p className="text-4xl font-bold tabular-nums">
            {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {recording ? "Listening… tap to stop" : "Tap the orb to start recording"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Playlist ({filtered.length})</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recordings"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button variant="outline" className="rounded-xl gap-1.5" onClick={newFolder}>
              <Plus className="h-4 w-4" /> Folder
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFolder(null)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              activeFolder === null ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
            }`}
          >
            All
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFolder(f.id)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                activeFolder === f.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card p-12 text-center text-muted-foreground">
            No recordings yet — your first take will land here.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((r) => (
              <RecordingCard key={r.id} rec={r} folders={folders} onChanged={refetch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
