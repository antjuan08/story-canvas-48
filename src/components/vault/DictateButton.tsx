import { useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  onTranscript: (text: string) => void;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return btoa(binary);
}

export function DictateButton({ onTranscript }: Props) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
      const mimeType = candidates.find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t)) || "";
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = mr.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        try {
          setBusy(true);
          const base64 = await blobToBase64(blob);
          const { data, error } = await supabase.functions.invoke("audio-ai", {
            body: { action: "transcribe", audioBase64: base64, mimeType: type },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          const text = (data?.transcript || "").trim();
          if (text) {
            onTranscript(text);
            toast.success("Transcribed");
          } else {
            toast.info("No speech detected");
          }
        } catch (e: any) {
          toast.error(e?.message || "Transcription failed");
        } finally {
          setBusy(false);
        }
      };
      mrRef.current = mr;
      mr.start(250);
      setRecording(true);
    } catch {
      toast.error("Could not access microphone");
    }
  };

  const stop = () => {
    mrRef.current?.stop();
    setRecording(false);
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={recording ? "destructive" : "outline"}
      className="rounded-xl gap-1.5"
      onClick={recording ? stop : start}
      disabled={busy}
      title={recording ? "Stop and transcribe" : "Dictate"}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : recording ? <Square className="h-3.5 w-3.5 fill-current" /> : <Mic className="h-3.5 w-3.5" />}
      {busy ? "Transcribing…" : recording ? "Stop" : "Dictate"}
    </Button>
  );
}
