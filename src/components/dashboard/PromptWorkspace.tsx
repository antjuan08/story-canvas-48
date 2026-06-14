import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, Check, Cloud, Loader2, Mic, Paperclip, Pencil, RotateCcw, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useStories } from "@/hooks/use-stories";
import { cn } from "@/lib/utils";

export const TABS = [
  { label: "Stories", path: "/stories" },
  { label: "Keynote", path: "/keynote" },
  { label: "Podcast", path: "/podcast" },
  { label: "Book", path: "/book" },
  { label: "Reimagined", path: "/reimagined" },
] as const;

export type TabLabel = (typeof TABS)[number]["label"];

const PLACEHOLDER: Record<TabLabel, string> = {
  Stories: "Tell me a story you want to remember…",
  Keynote: "Sketch your next keynote — topic, audience, big idea…",
  Podcast: "What's this podcast episode about?",
  Book: "Outline a chapter, scene, or whole book…",
  Reimagined: "Take an old story and reimagine it…",
};

const HEADING: Record<TabLabel, string> = {
  Stories: "What story will you tell?",
  Keynote: "What will you take the stage with?",
  Podcast: "What's on your mic today?",
  Book: "What chapter are you writing?",
  Reimagined: "What story will you reimagine?",
};

interface CloudItem { id: string; title: string }

type Mode = "idle" | "recording" | "transcribing" | "polishing" | "preview";

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

export function PromptWorkspace({ activeTab }: { activeTab: TabLabel }) {
  const { user } = useAuth();
  const { stories, refetch } = useStories();
  const navigate = useNavigate();

  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [refining, setRefining] = useState(false);
  const [floating, setFloating] = useState<string | null>(null);
  const [recentClouds, setRecentClouds] = useState<CloudItem[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Recording / polish state machine
  const [mode, setMode] = useState<Mode>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [polishTitle, setPolishTitle] = useState<string>("");
  const [polishText, setPolishText] = useState<string>("");
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    const filter = activeTab.toLowerCase();
    const filtered = activeTab === "Stories"
      ? stories
      : stories.filter((s) => s.category === filter || (s.tags ?? []).includes(filter));
    setRecentClouds(filtered.slice(0, 4).map((s) => ({ id: s.id, title: s.title })));
  }, [stories, activeTab]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, [text, mode]);

  useEffect(() => () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    try { mrRef.current?.stream?.getTracks().forEach((t) => t.stop()); } catch {}
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
      const mimeType = candidates.find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t)) || "";
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
        const type = mr.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        setMode("transcribing");
        try {
          const base64 = await blobToBase64(blob);
          const { data, error } = await supabase.functions.invoke("audio-ai", {
            body: { action: "transcribe", audioBase64: base64, mimeType: type },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          const transcript = (data?.transcript || "").trim();
          if (!transcript) {
            toast.info("No speech detected");
            setMode("idle");
            return;
          }
          // Auto-polish before sending to the cloud
          setMode("polishing");
          const refined = await supabase.functions.invoke("refine-story", {
            body: { text: transcript },
          });
          if (refined.error || refined.data?.error) {
            // Fall back to raw transcript if refine fails
            setPolishTitle("");
            setPolishText(transcript);
          } else {
            setPolishTitle((refined.data?.title || "").toString().slice(0, 80));
            setPolishText((refined.data?.refined || transcript).toString());
          }
          setMode("preview");
        } catch (e: any) {
          toast.error(e?.message || "Transcription failed");
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

  const stopRecording = () => {
    try { mrRef.current?.stop(); } catch {}
  };

  const toggleMic = () => {
    if (mode === "recording") stopRecording();
    else if (mode === "idle") startRecording();
  };

  const cancelPreview = () => {
    setPolishText(""); setPolishTitle(""); setMode("idle");
  };

  const editPreview = () => {
    setText(polishText);
    setPolishText(""); setPolishTitle(""); setMode("idle");
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const sendPreview = async () => {
    if (!user || !polishText.trim() || saving) return;
    setSaving(true);
    const title = (polishTitle || polishText.trim().split(/\n|\.|—|–/)[0]).slice(0, 80) || "Untitled";
    setFloating(title);
    const category = activeTab === "Stories" ? null : activeTab.toLowerCase();
    const { data, error } = await supabase
      .from("stories")
      .insert({ user_id: user.id, title, body: polishText.trim(), category, tags: [activeTab.toLowerCase()] })
      .select("id, title")
      .single();
    setSaving(false);
    if (error || !data) {
      setFloating(null);
      toast.error(error?.message ?? "Couldn't save");
      return;
    }
    setTimeout(() => {
      setFloating(null);
      setPolishText(""); setPolishTitle(""); setMode("idle");
      setRecentClouds((prev) => [{ id: data.id, title: data.title }, ...prev].slice(0, 4));
      refetch();
    }, 1500);
  };

  const handleSubmit = async () => {
    if (!user || !text.trim() || saving) return;
    setSaving(true);
    const body = text.trim();
    setFloating(body.slice(0, 60));

    // Get an AI-generated title (fall back to first sentence)
    let title = body.split(/\n|\.|—|–/)[0].slice(0, 80) || "Untitled";
    try {
      const { data } = await supabase.functions.invoke("refine-story", { body: { text: body } });
      const aiTitle = (data?.title || "").toString().trim();
      if (aiTitle) title = aiTitle.slice(0, 80);
    } catch { /* keep fallback */ }

    const category = activeTab === "Stories" ? null : activeTab.toLowerCase();
    const { data, error } = await supabase
      .from("stories")
      .insert({ user_id: user.id, title, body, category, tags: [activeTab.toLowerCase()] })
      .select("id, title")
      .single();

    setSaving(false);
    if (error || !data) {
      setFloating(null);
      toast.error(error?.message ?? "Couldn't save");
      return;
    }
    setTimeout(() => {
      setFloating(null);
      setText("");
      setRecentClouds((prev) => [{ id: data.id, title: data.title }, ...prev].slice(0, 4));
      refetch();
    }, 1500);
  };

  const handleRefine = async () => {
    if (!text.trim() || refining || saving) return;
    setRefining(true);
    try {
      const { data, error } = await supabase.functions.invoke("refine-story", {
        body: { text: text.trim() },
      });
      if (error || data?.error) throw new Error(error?.message ?? data?.error ?? "Refine failed");
      if (data?.refined) {
        setText(data.refined);
        toast.success("Refined by AI — tweak then send");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRefining(false);
    }
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="min-h-[calc(100vh-7rem)] flex flex-col">
      <CloudShelf clouds={recentClouds} onOpen={(id) => navigate(`/stories?story=${id}`)} />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-2 md:pt-4 pb-10">
        <div className="relative w-full max-w-3xl">
          {floating && (
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 z-10 animate-story-to-cloud">
              <div className="px-4 py-2 rounded-2xl bg-foreground text-background text-sm shadow-lg max-w-xs truncate">
                {floating}
              </div>
            </div>
          )}

          <div className="relative w-full group">
            <svg
              viewBox="0 0 200 110"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full drop-shadow-xl transition-all group-focus-within:drop-shadow-2xl"
              aria-hidden
            >
              <path
                d="M40,80 C18,80 10,55 30,48 C28,28 58,18 72,32 C82,16 116,18 124,38 C148,30 172,46 168,66 C188,70 188,90 168,92 L48,92 C30,92 26,84 40,80 Z"
                fill="hsl(var(--foreground))"
                stroke="hsl(var(--foreground))"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <div className="relative px-12 sm:px-20 md:px-28 lg:px-32 pt-24 sm:pt-28 pb-20 sm:pb-24">
              {mode === "recording" ? (
                <RecordingView elapsed={`${mm}:${ss}`} onStop={stopRecording} />
              ) : mode === "transcribing" || mode === "polishing" ? (
                <BusyView label={mode === "transcribing" ? "Transcribing…" : "Polishing your story…"} />
              ) : mode === "preview" ? (
                <PolishPreview
                  title={polishTitle}
                  text={polishText}
                  onChangeText={setPolishText}
                  onChangeTitle={setPolishTitle}
                  onSend={sendPreview}
                  onEdit={editPreview}
                  onRedo={cancelPreview}
                  sending={saving}
                />
              ) : (
                <>
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    rows={2}
                    placeholder={PLACEHOLDER[activeTab]}
                    disabled={saving}
                    className="w-full resize-none bg-transparent text-base text-background placeholder:text-background/50 outline-none disabled:opacity-60 text-center"
                  />
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1">
                      <IconBtn label="Attach"><Paperclip className="h-4 w-4" /></IconBtn>
                      <IconBtn label="Record" onClick={toggleMic}>
                        <Mic className="h-4 w-4" />
                      </IconBtn>
                      <button
                        type="button"
                        onClick={handleRefine}
                        disabled={!text.trim() || refining || saving}
                        aria-label="Refine with AI"
                        title="Refine with AI"
                        className={cn(
                          "h-9 px-3 inline-flex items-center gap-1.5 rounded-full text-xs transition-colors",
                          text.trim() && !refining && !saving
                            ? "text-background hover:bg-background/10"
                            : "text-background/50",
                        )}
                      >
                        {refining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        Refine
                      </button>
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={!text.trim() || saving || refining}
                      aria-label="Send"
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center transition-all",
                        text.trim() && !saving && !refining
                          ? "bg-background text-foreground hover:scale-105"
                          : "bg-background/15 text-background/50",
                      )}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-foreground/40 mt-3">
            <kbd className="font-sans">⌘</kbd> + <kbd className="font-sans">Enter</kbd> to send · saves to your {activeTab.toLowerCase()} cloud
          </p>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-center max-w-3xl text-foreground mt-16 sm:mt-24">
          {HEADING[activeTab]}
        </h1>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-9 w-9 rounded-full flex items-center justify-center text-background transition-colors",
        active ? "bg-background/20" : "hover:bg-background/10",
      )}
    >
      {children}
    </button>
  );
}

function RecordingView({ elapsed, onStop }: { elapsed: string; onStop: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="flex items-center gap-2 text-background/90">
        <span className="relative inline-flex h-2.5 w-2.5">
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        <span className="text-sm font-medium tracking-wide">Recording</span>
        <span className="text-sm tabular-nums text-background/70">{elapsed}</span>
      </div>
      <div className="w-full max-w-md h-1.5 rounded-full bg-background/15 overflow-hidden">
        <div className="h-full w-1/3 bg-background/70 rounded-full animate-[record-slide_1.4s_ease-in-out_infinite]" />
      </div>
      <button
        type="button"
        onClick={onStop}
        className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background text-foreground text-sm font-medium hover:scale-105 transition-transform"
      >
        <Square className="h-3.5 w-3.5 fill-current" />
        Stop &amp; transcribe
      </button>
      <style>{`@keyframes record-slide{0%{transform:translateX(-100%)}50%{transform:translateX(150%)}100%{transform:translateX(-100%)}}`}</style>
    </div>
  );
}

function BusyView({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-background/90">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function PolishPreview({
  title, text, onChangeTitle, onChangeText, onSend, onEdit, onRedo, sending,
}: {
  title: string; text: string;
  onChangeTitle: (v: string) => void;
  onChangeText: (v: string) => void;
  onSend: () => void; onEdit: () => void; onRedo: () => void;
  sending: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-background/70 text-[10px] uppercase tracking-widest">
        <Sparkles className="h-3 w-3" /> AI polished — review before it floats up
      </div>
      <input
        value={title}
        onChange={(e) => onChangeTitle(e.target.value)}
        placeholder="Title"
        className="w-full bg-transparent border-b border-background/20 text-background placeholder:text-background/40 text-lg font-serif outline-none pb-1"
      />
      <textarea
        value={text}
        onChange={(e) => onChangeText(e.target.value)}
        rows={5}
        className="w-full resize-none bg-transparent text-sm leading-relaxed text-background placeholder:text-background/40 outline-none max-h-60"
      />
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1">
          <button
            type="button" onClick={onRedo}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-full text-xs text-background hover:bg-background/10"
            title="Discard and record again"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Redo
          </button>
          <button
            type="button" onClick={onEdit}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-full text-xs text-background hover:bg-background/10"
            title="Edit in the main box"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
        <button
          type="button" onClick={onSend} disabled={sending || !text.trim()}
          className={cn(
            "h-9 px-4 inline-flex items-center gap-1.5 rounded-full text-xs font-medium transition-all",
            !sending && text.trim()
              ? "bg-background text-foreground hover:scale-105"
              : "bg-background/15 text-background/50",
          )}
        >
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Send to cloud
        </button>
      </div>
    </div>
  );
}

function CloudShelf({ clouds, onOpen }: { clouds: CloudItem[]; onOpen: (id: string) => void }) {
  if (clouds.length === 0) {
    return (
      <div className="flex justify-center items-center gap-2 pt-8 text-foreground/40 text-sm">
        <Cloud className="h-4 w-4" />
        <span>Your cloud is empty — write something to fill the sky.</span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap justify-center gap-3 pt-10 px-4 max-w-5xl mx-auto">
      {clouds.map((c, i) => (
        <button
          key={c.id}
          onClick={() => onOpen(c.id)}
          className="group relative animate-cloud-pop focus:outline-none"
          style={{ animationDelay: `${i * 60}ms` }}
          title={c.title}
        >
          <div className="animate-cloud-drift">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/70 border border-foreground/10 backdrop-blur-sm shadow-sm group-hover:shadow-md group-hover:border-foreground/30 group-focus-visible:ring-2 group-focus-visible:ring-foreground/40 transition-all cursor-pointer">
              <Cloud className="h-3.5 w-3.5 text-foreground/50" />
              <span className="text-xs text-foreground/80 max-w-[10rem] truncate">{c.title}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
