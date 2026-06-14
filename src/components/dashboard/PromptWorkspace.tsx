import { useEffect, useRef, useState } from "react";
import { ArrowUp, Cloud, Loader2, Mic, Paperclip, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useStories } from "@/hooks/use-stories";
import { cn } from "@/lib/utils";
import { TabNav } from "@/components/nav/TabNav";

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

export function PromptWorkspace({ activeTab }: { activeTab: TabLabel }) {
  const { user } = useAuth();
  const { stories, refetch } = useStories();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [refining, setRefining] = useState(false);
  const [floating, setFloating] = useState<string | null>(null);
  const [recentClouds, setRecentClouds] = useState<CloudItem[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const filter = activeTab.toLowerCase();
    const filtered = activeTab === "Stories"
      ? stories
      : stories.filter((s) => s.category === filter || (s.tags ?? []).includes(filter));
    setRecentClouds(filtered.slice(0, 8).map((s) => ({ id: s.id, title: s.title })));
  }, [stories, activeTab]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, [text]);

  const handleSubmit = async () => {
    if (!user || !text.trim() || saving) return;
    setSaving(true);
    setFloating(text.trim().slice(0, 60));

    const title = text.trim().split(/\n|\.|—|–/)[0].slice(0, 80) || "Untitled";
    const body = text.trim();
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
      setRecentClouds((prev) => [{ id: data.id, title: data.title }, ...prev].slice(0, 8));
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

  return (
    <div className="min-h-[calc(100vh-7rem)] flex flex-col">
      <CloudShelf clouds={recentClouds} />

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
            {/* Cloud-shaped backdrop — inked with --foreground so it inverts with the theme
                 (charcoal cloud on cream light mode, bone cloud on charcoal dark mode). */}
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

            {/* Cloud content — generous insets so the textarea + action row sit fully inside the cloud body */}
            <div className="relative px-12 sm:px-20 md:px-28 lg:px-32 pt-20 sm:pt-24 pb-16 sm:pb-20">
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
                  <IconBtn label="Dictate"><Mic className="h-4 w-4" /></IconBtn>
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

function IconBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="h-9 w-9 rounded-full flex items-center justify-center text-background hover:bg-background/10 transition-colors"
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
        <span>Your cloud is empty — write something to fill the sky.</span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap justify-center gap-3 pt-10 px-4 max-w-5xl mx-auto">
      {clouds.map((c, i) => (
        <div key={c.id} className="group relative animate-cloud-pop" style={{ animationDelay: `${i * 60}ms` }}>
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
