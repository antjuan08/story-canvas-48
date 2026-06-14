import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Cloud, Loader2, Mic, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useStories, type Story } from "@/hooks/use-stories";
import { cn } from "@/lib/utils";

const TABS = ["Stories", "Keynote", "Podcast", "Book", "Reimagined"] as const;
type Tab = (typeof TABS)[number];

const PLACEHOLDER: Record<Tab, string> = {
  Stories: "Tell me a story you want to remember…",
  Keynote: "Sketch your next keynote — topic, audience, big idea…",
  Podcast: "What's this podcast episode about?",
  Book: "Outline a chapter, scene, or whole book…",
  Reimagined: "Take an old story and reimagine it…",
};

interface CloudItem {
  id: string;
  title: string;
}

export function Dashboard() {
  const { user } = useAuth();
  const { stories, refetch } = useStories();
  const [tab, setTab] = useState<Tab>("Stories");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [floating, setFloating] = useState<string | null>(null);
  const [recentClouds, setRecentClouds] = useState<CloudItem[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Seed cloud shelf from latest stories
  useEffect(() => {
    setRecentClouds(stories.slice(0, 8).map((s) => ({ id: s.id, title: s.title })));
  }, [stories]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, [text]);

  const heading = useMemo(() => {
    switch (tab) {
      case "Stories": return "What story will you tell?";
      case "Keynote": return "What will you take the stage with?";
      case "Podcast": return "What's on your mic today?";
      case "Book": return "What chapter are you writing?";
      case "Reimagined": return "What story will you reimagine?";
    }
  }, [tab]);

  const handleSubmit = async () => {
    if (!user || !text.trim() || saving) return;
    setSaving(true);

    // Float-to-cloud animation begins immediately for snappy feedback
    setFloating(text.trim().slice(0, 60));

    const title = text.trim().split(/\n|\.|—|–/)[0].slice(0, 80) || "Untitled";
    const body = text.trim();
    const category = tab === "Stories" ? null : tab.toLowerCase();

    const { data, error } = await supabase
      .from("stories")
      .insert({ user_id: user.id, title, body, category, tags: [tab.toLowerCase()] })
      .select("id, title")
      .single();

    setSaving(false);
    if (error || !data) {
      setFloating(null);
      toast.error(error?.message ?? "Couldn't save");
      return;
    }

    // After float animation, drop it into the cloud shelf
    setTimeout(() => {
      setFloating(null);
      setText("");
      setRecentClouds((prev) => [{ id: data.id, title: data.title }, ...prev].slice(0, 8));
      refetch();
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] flex flex-col">
      {/* Top tabs */}
      <nav className="flex justify-center pt-2">
        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                tab === t
                  ? "bg-foreground text-background"
                  : "text-foreground/70 hover:text-foreground hover:bg-foreground/5",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </nav>

      {/* Cloud shelf */}
      <CloudShelf clouds={recentClouds} />

      {/* Center heading + prompt */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-center max-w-3xl text-foreground">
          {heading}
        </h1>

        <div className="relative w-full max-w-2xl mt-10">
          {/* Floating preview chip during save */}
          {floating && (
            <div
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 z-10 animate-story-to-cloud"
            >
              <div className="px-4 py-2 rounded-2xl bg-foreground text-background text-sm shadow-lg max-w-xs truncate">
                {floating}
              </div>
            </div>
          )}

          <div className={cn(
            "rounded-3xl border border-foreground/10 bg-background/60 backdrop-blur-sm shadow-sm",
            "focus-within:border-foreground/30 focus-within:shadow-md transition-all",
          )}>
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
              rows={1}
              placeholder={PLACEHOLDER[tab]}
              disabled={saving}
              className="w-full resize-none bg-transparent px-5 pt-4 pb-2 text-base text-foreground placeholder:text-foreground/40 outline-none disabled:opacity-60"
            />
            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              <div className="flex items-center gap-1">
                <IconBtn label="Attach"><Paperclip className="h-4 w-4" /></IconBtn>
                <IconBtn label="Dictate"><Mic className="h-4 w-4" /></IconBtn>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || saving}
                aria-label="Send"
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center transition-all",
                  text.trim() && !saving
                    ? "bg-foreground text-background hover:scale-105"
                    : "bg-foreground/10 text-foreground/40",
                )}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-foreground/40 mt-3">
            <kbd className="font-sans">⌘</kbd> + <kbd className="font-sans">Enter</kbd> to send · saves to your {tab.toLowerCase()} cloud
          </p>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="h-9 w-9 rounded-full flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
    >
      {children}
    </button>
  );
}

function CloudShelf({ clouds }: { clouds: CloudItem[] }) {
  if (clouds.length === 0) {
    return (
      <div className="flex justify-center items-center gap-2 pt-8 text-foreground/40 text-sm">
        <Cloud className="h-4 w-4" />
        <span>Your cloud is empty — write a story to fill the sky.</span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap justify-center gap-3 pt-10 px-4 max-w-5xl mx-auto">
      {clouds.map((c, i) => (
        <div
          key={c.id}
          className="group relative animate-cloud-pop"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="animate-cloud-drift">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/70 border border-foreground/10 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-foreground/20 transition-all cursor-default">
              <Cloud className="h-3.5 w-3.5 text-foreground/50" />
              <span className="text-xs text-foreground/70 max-w-[10rem] truncate">{c.title}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Keep export for any older imports
export type { Story };
