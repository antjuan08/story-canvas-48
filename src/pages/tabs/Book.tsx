import { SEO } from "@/components/seo/SEO";
import { useEffect, useMemo, useState } from "react";
import { Plus, Loader2, BookOpen, Library as LibraryIcon, BookMarked } from "lucide-react";
import { toast } from "sonner";
import { TabNav } from "@/components/nav/TabNav";
import { useStories } from "@/hooks/use-stories";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StoryPicker } from "@/components/builders/StoryPicker";
import { ItemOverflowMenu } from "@/components/shared/ItemOverflowMenu";
import { cn } from "@/lib/utils";
import bookIllustration from "@/assets/illustration-book.png";


type Book = {
  id: string; title: string; template: string; premise: string | null;
  payload: any; created_at: string;
};

const BOOK_TEMPLATES = [
  { id: "fiction",        label: "Fiction",        desc: "Novels, short stories, imagined worlds." },
  { id: "non-fiction",    label: "Non-fiction",    desc: "True stories, journalism, essays." },
  { id: "self-help",      label: "Self-help",      desc: "A framework that helps the reader change." },
  { id: "autobiography",  label: "Autobiography",  desc: "Your life, in your own voice." },
  { id: "instructional",  label: "Instructional",  desc: "Step-by-step, how-to guide." },
  { id: "educational",    label: "Educational",    desc: "Teach a subject with depth and clarity." },
];

export default function Book() {
  const { user } = useAuth();
  const { stories } = useStories();
  const [books, setBooks] = useState<Book[]>([]);
  const [idx, setIdx] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [tab, setTab] = useState<"reader" | "library">("reader");
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const current = stories[idx];

  const activeBook = useMemo(
    () => books.find((b) => b.id === activeBookId) ?? null,
    [books, activeBookId]
  );
  const bookStoryIds: string[] = (activeBook?.payload?.story_ids ?? []) as string[];
  const bookChapters = useMemo(() => {
    if (!activeBook) return stories;
    if (!bookStoryIds.length) return stories;
    const map = new Map(stories.map((s) => [s.id, s]));
    return bookStoryIds.map((id) => map.get(id)).filter(Boolean) as typeof stories;
  }, [activeBook, bookStoryIds, stories]);
  const currentChapter = bookChapters[idx];

  const refetch = async () => {
    if (!user) return;
    const { data } = await supabase.from("books").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setBooks((data ?? []) as Book[]);
  };
  useEffect(() => { refetch(); }, [user]);

  const openBookInReader = (id: string) => {
    setActiveBookId(id);
    setIdx(0);
    setTab("reader");
  };

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <SEO title="Book library · StoryYou" description="Shape your collected stories into long-form chapters and start your book." path="/book" />
      <TabNav active="Book" />

      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="grid md:grid-cols-[360px_1fr] items-center gap-8 mb-6">
          <img src={bookIllustration} alt="Stick figure student in a library" className="w-full max-w-[360px] object-contain" loading="lazy" />
          <div className="flex items-end justify-between gap-6">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight">The library.</h1>
              <p className="text-sm text-foreground/60 mt-1">Chapter your stories. Begin a book.</p>
            </div>
            <Button onClick={() => setPickerOpen(true)} className="rounded-full">
              <Plus className="h-4 w-4 mr-2" /> Add a book
            </Button>
          </div>
        </div>

        {books.length > 0 && (
          <div className="mb-10">
            <div className="text-xs uppercase tracking-widest text-foreground/50 mb-3">My books</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((b) => (
                <div key={b.id} className="relative group p-5 rounded-2xl border border-foreground/10 bg-background/70">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ItemOverflowMenu kind="book" item={b} table="books" onDeleted={refetch} />
                  </div>
                  <BookOpen className="h-4 w-4 text-foreground/40 mb-2" />
                  <div className="font-serif text-xl leading-tight">{b.title}</div>
                  <div className="text-[10px] uppercase tracking-widest text-foreground/50 mt-1">{b.template}</div>
                  <p className="text-xs text-foreground/70 mt-2 line-clamp-3">{b.premise ?? "—"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20 grid lg:grid-cols-[220px_1fr] gap-8">
        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="text-xs uppercase tracking-widest text-foreground/50 mb-3">Chapters</div>
          {stories.length === 0 ? (
            <p className="text-sm text-foreground/50">No chapters yet.</p>
          ) : (
            <ol className="space-y-1">
              {stories.map((s, i) => (
                <li key={s.id}>
                  <button onClick={() => setIdx(i)}
                    className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition",
                      i === idx ? "bg-foreground text-background" : "hover:bg-foreground/5 text-foreground/80")}>
                    <span className="font-serif">{String(i + 1).padStart(2, "0")}. </span>
                    <span className="font-serif">{s.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </aside>

        {current ? (
          <div className="relative">
            <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)] border border-foreground/10">
              <div className="bg-[hsl(48,40%,97%)] p-10 md:p-14 min-h-[70vh] relative">
                <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/50">Chapter {String(idx + 1).padStart(2, "0")}</div>
                <h1 className="font-serif text-4xl lg:text-5xl font-light leading-[1.1] mt-3">{current.title}</h1>
                <div className="mt-8 border-t border-foreground/15 pt-6">
                  <p className="font-serif text-base leading-[1.85] text-foreground/85">
                    <span className="font-serif text-6xl float-left mr-3 mt-1 leading-none">
                      {(current.body ?? "—").trim().charAt(0)}
                    </span>
                    {(current.body ?? "—").trim().slice(1, 700)}
                  </p>
                </div>
                <div className="absolute bottom-6 left-10 text-xs text-foreground/40">— {idx * 2 + 1} —</div>
              </div>
              <div className="bg-[hsl(48,30%,94%)] p-10 md:p-14 min-h-[70vh] relative border-l border-foreground/10">
                <p className="font-serif text-base leading-[1.85] text-foreground/85 whitespace-pre-wrap">
                  {(current.body ?? "").slice(700) || "…"}
                </p>
                <div className="absolute bottom-6 right-10 text-xs text-foreground/40">— {idx * 2 + 2} —</div>
              </div>
            </div>
            <div className="flex justify-between mt-6 text-sm">
              <button disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="text-foreground/70 hover:text-foreground disabled:opacity-30">← Previous</button>
              <button disabled={idx >= stories.length - 1} onClick={() => setIdx(idx + 1)} className="text-foreground/70 hover:text-foreground disabled:opacity-30">Next →</button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-foreground/50 font-serif text-xl">An empty book — write a story to fill the first page.</div>
        )}
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">What kind of book?</DialogTitle>
            <DialogDescription>Pick a template — it shapes the chapters we'll suggest.</DialogDescription>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3 py-2">
            {BOOK_TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => { setTemplateId(t.id); setPickerOpen(false); }}
                className="text-left p-5 rounded-2xl border border-foreground/10 hover:bg-foreground/5 hover:border-foreground/30 transition">
                <div className="font-serif text-lg">{t.label}</div>
                <p className="text-xs text-foreground/60 mt-1">{t.desc}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <NewBookDialog templateId={templateId} onClose={() => setTemplateId(null)} onSaved={() => { setTemplateId(null); refetch(); }} />
    </div>
  );
}

function NewBookDialog({ templateId, onClose, onSaved }: { templateId: string | null; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [storyIds, setStoryIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const tmpl = BOOK_TEMPLATES.find((t) => t.id === templateId);

  useEffect(() => { if (!templateId) { setTitle(""); setPremise(""); setStoryIds([]); } }, [templateId]);

  const save = async () => {
    if (!user || !title.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("books").insert({
      user_id: user.id,
      title: title.trim(),
      template: templateId!,
      premise: premise.trim() || null,
      payload: { story_ids: storyIds },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Book started");
    onSaved();
  };

  return (
    <Dialog open={!!templateId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="text-xs uppercase tracking-widest text-foreground/50">{tmpl?.label}</div>
          <DialogTitle className="font-serif text-2xl">New book</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2"><Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Working title" /></div>
          <div className="space-y-2"><Label>Premise</Label>
            <Textarea value={premise} onChange={(e) => setPremise(e.target.value)} rows={4} placeholder="In one paragraph, what is this book about?" /></div>

          <div className="space-y-2 pt-2 border-t border-foreground/10">
            <Label className="text-sm">Source stories</Label>
            <p className="text-xs text-foreground/55">Pull from your library, or let AI choose the stories most likely to anchor this book.</p>
            <StoryPicker
              purpose="book"
              context={`Template: ${tmpl?.label}\nTitle: ${title}\nPremise: ${premise}`}
              selected={storyIds}
              onChange={setStoryIds}
              max={8}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={busy || !title.trim()}>
            {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Start book"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

