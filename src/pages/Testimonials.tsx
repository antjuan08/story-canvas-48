import { useEffect, useState } from "react";
import { Star, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type Testimonial = {
  id: string; name: string; title: string | null; quote: string; rating: number; created_at: string;
};

export default function Testimonials() {
  const { user } = useAuth();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [open, setOpen] = useState(false);

  const refetch = async () => {
    const { data } = await (supabase as any).from("testimonials").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as Testimonial[]);
  };
  useEffect(() => { refetch(); }, []);

  return (
    <div className="min-h-[calc(100vh-7rem)] max-w-5xl mx-auto px-6 pt-12 pb-20">
      <SEO
        title="Testimonials · StoryYou"
        description="What storytellers, speakers, and creators say about turning their moments into stories with StoryYou."
        path="/testimonials"
        jsonLd={items.slice(0, 20).map((t) => ({
          "@context": "https://schema.org",
          "@type": "Review",
          reviewBody: t.quote,
          author: { "@type": "Person", name: t.name },
          reviewRating: { "@type": "Rating", ratingValue: t.rating, bestRating: 5 },
          itemReviewed: { "@type": "Organization", name: "StoryYou" },
        }))}
      />
      <div className="flex items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight">Testimonials.</h1>
          <p className="text-sm text-foreground/60 mt-2">Words from people who turned moments into stories.</p>
        </div>
        {user && (
          <Button onClick={() => setOpen(true)} className="rounded-full">
            <Plus className="h-4 w-4 mr-2" /> Share yours
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-center text-foreground/50 py-24 font-serif text-xl">No testimonials yet — be the first.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((t) => (
            <article key={t.id} className="rounded-3xl border border-foreground/10 bg-background/70 p-6 shadow-sm">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < t.rating ? "fill-foreground text-foreground" : "text-foreground/20"}`} />
                ))}
              </div>
              <p className="font-serif text-lg leading-relaxed">"{t.quote}"</p>
              <div className="mt-4 text-sm">
                <div className="font-medium">{t.name}</div>
                {t.title && <div className="text-xs text-foreground/55">{t.title}</div>}
              </div>
            </article>
          ))}
        </div>
      )}

      <AddDialog open={open} onOpenChange={setOpen} onSaved={refetch} />
    </div>
  );
}

function AddDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!open) { setName(""); setTitle(""); setQuote(""); setRating(5); } }, [open]);

  const submit = async () => {
    if (!user || !name.trim() || !quote.trim()) { toast.error("Name and quote are required"); return; }
    setBusy(true);
    const { error } = await (supabase as any).from("testimonials").insert({
      user_id: user.id, name: name.trim(), title: title.trim() || null, quote: quote.trim(), rating,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks for sharing");
    onSaved(); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="font-serif text-2xl">Share your testimonial</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Title (optional)</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Author · Speaker · Storyteller" /></div>
          <div className="space-y-1.5"><Label>Your words</Label><Textarea rows={4} value={quote} onChange={(e) => setQuote(e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} type="button" onClick={() => setRating(i + 1)} aria-label={`${i + 1} stars`}>
                  <Star className={`h-6 w-6 ${i < rating ? "fill-foreground text-foreground" : "text-foreground/30"}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
