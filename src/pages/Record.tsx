import { useRef, useState } from "react";
import { toast } from "sonner";
import { MicOrb } from "@/components/record/MicOrb";
import { RecordingCard } from "@/components/record/RecordingCard";
import { useRecordingsStore } from "@/stores/recordingsStore";

export function Record() {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);
  const add = useRecordingsStore((s) => s.add);
  const items = useRecordingsStore((s) => s.items);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(blob);
        });
        const duration = (Date.now() - startRef.current) / 1000;
        add({
          id: crypto.randomUUID(),
          name: `Recording ${new Date().toLocaleString()}`,
          url,
          duration,
          createdAt: Date.now(),
        });
        stream.getTracks().forEach((t) => t.stop());
        toast.success("Recording saved to your playlist");
      };
      mediaRecorderRef.current = mr;
      startRef.current = Date.now();
      mr.start();
      setRecording(true);
      setElapsed(0);
      tickRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (e) {
      toast.error("Could not access microphone");
    }
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (tickRef.current) window.clearInterval(tickRef.current);
  };

  const toggle = () => (recording ? stop() : start());

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Record</h1>
        <p className="text-muted-foreground mt-1">
          Record your voice, save it to your playlist, transcribe it, then let AI rewrite it as a story.
        </p>
      </div>

      <div className="glass-card p-10 flex flex-col items-center gap-6">
        <MicOrb recording={recording} onToggle={toggle} />
        <div className="text-center">
          <p className="text-4xl font-bold tabular-nums">
            {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {recording ? "Listening… tap to stop" : "Tap the orb to start recording"}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Playlist ({items.length})</h2>
        {items.length === 0 ? (
          <div className="glass-card p-12 text-center text-muted-foreground">
            No recordings yet — your first take will land here.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((r) => <RecordingCard key={r.id} rec={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
