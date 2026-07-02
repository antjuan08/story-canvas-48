import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";
import { SiteFooter } from "@/components/layout/SiteFooter";
import illustrationKeynote from "@/assets/illustration-keynote.png";
import illustrationPodcast from "@/assets/illustration-podcast.png";
import illustrationBook from "@/assets/illustration-book.png";
import illustrationReimagined from "@/assets/illustration-reimagined.png";

type Testimonial = {
  id: string;
  name: string;
  title: string | null;
  quote: string;
  rating: number;
};

const FEATURES: {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  alt: string;
}[] = [
  {
    eyebrow: "Record",
    title: "Speak it once. Keep it forever.",
    body: "Capture your voice in a quiet, distraction-free space. Storyou listens, transcribes, and preserves the story exactly as you told it.",
    image: illustrationPodcast,
    alt: "Illustration of a podcast microphone",
  },
  {
    eyebrow: "Refine",
    title: "An AI speaking coach in the room.",
    body: "Get thoughtful feedback on clarity, cadence, and craft. Polish or rewrite with a single tap — your voice, sharpened.",
    image: illustrationKeynote,
    alt: "Illustration of a keynote stage",
  },
  {
    eyebrow: "Publish",
    title: "One story. Every format.",
    body: "Turn a single spoken moment into a keynote, a podcast episode, or a chapter of your book — without starting over.",
    image: illustrationBook,
    alt: "Illustration of an open book",
  },
  {
    eyebrow: "Reimagine",
    title: "Cinematic, from a whisper.",
    body: "Watch your words become a short film. Generative video renders your stories with the mood and pacing you'd choose yourself.",
    image: illustrationReimagined,
    alt: "Illustration of a cinematic reimagined scene",
  },
];

export default function Landing() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("testimonials")
        .select("id, name, title, quote, rating")
        .order("created_at", { ascending: false })
        .limit(6);
      setTestimonials((data ?? []) as Testimonial[]);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-brand-bone text-brand-anchor">
      <SEO
        title="Storyou — Your voice, made lasting."
        description="Storyou turns spoken stories into keynotes, podcasts, books, and cinematic reimaginings — with an AI speaking coach built in."
        path="/landing"
      />

      {/* Sticky nav */}
      <header className="sticky top-0 z-40 backdrop-blur bg-brand-bone/80 border-b border-brand-anchor/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/landing" className="font-serif text-xl tracking-tight">
            Storyou<span className="text-brand-brass">.</span>
          </Link>
          <Button asChild size="sm" className="rounded-full bg-brand-anchor text-brand-bone hover:bg-brand-anchor/90">
            <Link to="/">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 sm:pt-32 pb-20 sm:pb-32 text-center">
        <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-light tracking-tight leading-[1.02] max-w-5xl mx-auto">
          Your voice,<br />
          <span className="italic text-brand-brass">made lasting.</span>
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-brand-anchor/60 max-w-2xl mx-auto leading-relaxed">
          Turn spoken moments into keynotes, podcasts, books, and cinematic
          reimaginings — with an AI speaking coach built in.
        </p>
        <div className="mt-10 flex justify-center">
          <Button asChild size="lg" className="rounded-full h-12 px-8 bg-brand-anchor text-brand-bone hover:bg-brand-anchor/90 text-base">
            <Link to="/">Get started</Link>
          </Button>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-brand-anchor/10 bg-brand-bone">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: "10k+", l: "stories captured" },
            { n: "4", l: "formats, one voice" },
            { n: "AI", l: "speaking coach" },
            { n: "∞", l: "keepsakes made" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-serif text-3xl sm:text-4xl font-light">{s.n}</div>
              <div className="text-xs uppercase tracking-widest text-brand-anchor/50 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature blocks */}
      <section className="max-w-7xl mx-auto px-6 py-24 sm:py-32 space-y-24 sm:space-y-40">
        {FEATURES.map((f, i) => {
          const flipped = i % 2 === 1;
          return (
            <div
              key={f.title}
              className={`grid lg:grid-cols-2 gap-10 lg:gap-20 items-center ${
                flipped ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="aspect-[4/3] rounded-3xl bg-brand-anchor/[0.04] overflow-hidden flex items-center justify-center p-10">
                <img
                  src={f.image}
                  alt={f.alt}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="max-w-lg">
                <div className="text-xs uppercase tracking-[0.2em] text-brand-brass mb-4">
                  {f.eyebrow}
                </div>
                <h2 className="font-serif text-4xl sm:text-5xl font-light tracking-tight leading-tight">
                  {f.title}
                </h2>
                <p className="mt-5 text-base sm:text-lg text-brand-anchor/60 leading-relaxed">
                  {f.body}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="border-t border-brand-anchor/10 bg-brand-bone">
          <div className="max-w-7xl mx-auto px-6 py-24 sm:py-32">
            <div className="text-center mb-16">
              <div className="text-xs uppercase tracking-[0.2em] text-brand-brass mb-3">
                Voices
              </div>
              <h2 className="font-serif text-4xl sm:text-5xl font-light tracking-tight">
                From the storytellers.
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <article
                  key={t.id}
                  className="rounded-3xl border border-brand-anchor/10 bg-brand-bone p-8"
                >
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < t.rating
                            ? "fill-brand-anchor text-brand-anchor"
                            : "text-brand-anchor/20"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="font-serif text-lg leading-relaxed">
                    "{t.quote}"
                  </p>
                  <div className="mt-5 text-sm">
                    <div className="font-medium">{t.name}</div>
                    {t.title && (
                      <div className="text-xs text-brand-anchor/55 mt-0.5">
                        {t.title}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA — inverted */}
      <section className="bg-brand-anchor text-brand-bone">
        <div className="max-w-4xl mx-auto px-6 py-24 sm:py-32 text-center">
          <h2 className="font-serif text-4xl sm:text-6xl font-light tracking-tight leading-tight">
            The story you've yet to tell<br />
            <span className="italic text-brand-brass">is already yours.</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-brand-bone/60 max-w-xl mx-auto">
            Begin with a single spoken sentence. Storyou takes it from there.
          </p>
          <div className="mt-10">
            <Button
              asChild
              size="lg"
              className="rounded-full h-12 px-8 bg-brand-bone text-brand-anchor hover:bg-brand-bone/90 text-base"
            >
              <Link to="/">Get started</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
