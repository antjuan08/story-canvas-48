import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, ArrowRight, Play, Check, ChevronDown, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useInView } from "@/hooks/use-in-view";
import wordmarkAsset from "@/assets/storyou-wordmark.png.asset.json";
import markAsset from "@/assets/storyou-mark.png.asset.json";
import heroThinkerAsset from "@/assets/hero-thinker.png.asset.json";

type Testimonial = {
  id: string;
  name: string;
  title: string | null;
  quote: string;
  rating: number;
};

/* ---------- Fade-in wrapper ---------- */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ---------- Decorative placeholder panels ---------- */
function Placeholder({
  tone = "bone",
  aspect = "aspect-[4/3]",
  label = "Image",
  doodle,
  className,
}: {
  tone?: "bone" | "sky" | "warm" | "anchor";
  aspect?: string;
  label?: string;
  doodle?: "squiggle" | "arrow" | "spiral" | "wave" | null;
  className?: string;
}) {
  const toneClass = {
    bone: "bg-brand-anchor/[0.04] text-brand-anchor/40",
    sky: "bg-[hsl(210,45%,88%)] text-brand-anchor/50",
    warm: "bg-brand-brass/15 text-brand-anchor/50",
    anchor: "bg-brand-anchor text-brand-bone/50",
  }[tone];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl flex items-center justify-center",
        aspect,
        toneClass,
        className
      )}
    >
      {doodle === "squiggle" && (
        <svg viewBox="0 0 200 80" className="absolute inset-0 m-auto w-2/5 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M10 40 Q 30 10, 50 40 T 90 40 T 130 40 T 170 40 T 190 40" />
        </svg>
      )}
      {doodle === "arrow" && (
        <svg viewBox="0 0 200 100" className="absolute inset-0 m-auto w-3/5 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M10 80 C 60 20, 120 20, 170 60" />
          <path d="M155 45 L 172 62 L 152 68" />
        </svg>
      )}
      {doodle === "spiral" && (
        <svg viewBox="0 0 120 120" className="absolute inset-0 m-auto w-2/5 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M60 60 m-2 0 a2 2 0 1 1 4 0 a6 6 0 1 1 -12 0 a12 12 0 1 1 24 0 a20 20 0 1 1 -40 0 a30 30 0 1 1 60 0" />
        </svg>
      )}
      {doodle === "wave" && (
        <svg viewBox="0 0 200 60" className="absolute inset-0 m-auto w-1/2 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M10 30 Q 40 5, 70 30 T 130 30 T 190 30" />
        </svg>
      )}
      <span className="relative text-[10px] tracking-[0.3em] uppercase font-medium">
        {label}
      </span>
    </div>
  );
}

/* ---------- Nav ---------- */
const NAV: { label: string; items: string[] }[] = [
  { label: "Story", items: ["StoryCloud", "Signature Story", "Storyboard", "Enterprise Stories"] },
  { label: "Stage", items: ["Keynote", "Feedback Coach"] },
  { label: "Studio", items: ["Podcast", "Reimagine Studio"] },
  { label: "Support", items: ["StoryU", "Tutorials", "Courses", "Case Studies"] },
];

function NavDropdown({ label, items }: { label: string; items: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="flex items-center gap-1 py-2 hover:text-brand-anchor transition-colors"
      >
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", open && "rotate-180")} />
      </button>
      <div
        role="menu"
        className={cn(
          "absolute left-0 top-full pt-2 w-56 transition-all",
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
        )}
      >
        <div className="rounded-2xl border border-brand-anchor/10 bg-brand-bone shadow-lg shadow-brand-anchor/5 p-2">
          {items.map((item) => (
            <Link
              key={item}
              to="/"
              role="menuitem"
              className="block rounded-xl px-3 py-2 text-sm text-brand-anchor/80 hover:text-brand-anchor hover:bg-brand-anchor/[0.04] transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Nav() {
  const { session } = useAuth();
  const ctaHref = session ? "/dashboard" : "/auth";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all",
        scrolled || mobileOpen
          ? "backdrop-blur bg-brand-bone/85 border-b border-brand-anchor/10"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-8">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0" aria-label="Storyou home">
          <img src={markAsset.url} alt="" className="h-10 sm:h-16 w-auto" />
          <img src={wordmarkAsset.url} alt="Storyou" className="h-6 sm:h-10 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-sm text-brand-anchor/80">
          {NAV.map((n) => (
            <NavDropdown key={n.label} label={n.label} items={n.items} />
          ))}
        </nav>

        <button
          type="button"
          className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-brand-anchor/5 text-brand-anchor/80"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", mobileOpen && "rotate-180")} />
        </button>

        {mobileOpen && (
          <div className="lg:hidden absolute left-0 right-0 top-full bg-brand-bone border-b border-brand-anchor/10 px-6 py-4">
            <div className="max-w-7xl mx-auto flex flex-col gap-1 text-sm">
              {NAV.map((n) => {
                const isOpen = expanded === n.label;
                return (
                  <div key={n.label} className="border-b border-brand-anchor/5 last:border-0">
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : n.label)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between py-3 text-brand-anchor"
                    >
                      {n.label}
                      <ChevronDown className={cn("h-4 w-4 opacity-60 transition-transform", isOpen && "rotate-180")} />
                    </button>
                    {isOpen && (
                      <div className="pb-3 pl-3 flex flex-col gap-1">
                        {n.items.map((item) => (
                          <Link
                            key={item}
                            to="/"
                            onClick={() => setMobileOpen(false)}
                            className="py-2 text-brand-anchor/70 hover:text-brand-anchor"
                          >
                            {item}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!session && (
            <Link
              to="/auth"
              className="hidden sm:inline-flex text-sm text-brand-anchor/70 hover:text-brand-anchor transition-colors"
            >
              Sign in
            </Link>
          )}
          <Button
            asChild
            size="sm"
            className="rounded-full bg-brand-anchor text-brand-bone hover:bg-brand-anchor/90 px-3 sm:px-5 text-xs sm:text-sm"
          >
            <Link to={ctaHref}>
              <span className="sm:hidden">Start</span>
              <span className="hidden sm:inline">Start your story</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ---------- Feature data ---------- */
const FEATURES = [
  {
    eyebrow: "Record",
    title: "Speak it once. Keep it forever.",
    body: "Capture your voice in a quiet, distraction-free space. Storyou listens, transcribes, and preserves the story exactly as you told it.",
    tone: "sky" as const,
    doodle: "wave" as const,
  },
  {
    eyebrow: "Refine",
    title: "An AI speaking coach, in the room.",
    body: "Get thoughtful feedback on clarity, cadence, and craft. Polish or rewrite with a single tap — your voice, sharpened.",
    tone: "bone" as const,
    doodle: "squiggle" as const,
  },
  {
    eyebrow: "Publish",
    title: "One story. Every format.",
    body: "Turn a single spoken moment into a keynote, a podcast episode, or a chapter of your book — without starting over.",
    tone: "warm" as const,
    doodle: "arrow" as const,
  },
  {
    eyebrow: "Reimagine",
    title: "Cinematic, from a whisper.",
    body: "Watch your words become a short film. Generative video renders your stories with the mood and pacing you'd choose yourself.",
    tone: "anchor" as const,
    doodle: "spiral" as const,
  },
];

const PRODUCTS = [
  {
    name: "Storyou",
    accent: "Keynote",
    tone: "sky" as const,
    doodle: "arrow" as const,
    tagline: "Our stage-ready story tool",
  },
  {
    name: "Storyou",
    accent: "Podcast",
    tone: "bone" as const,
    doodle: "wave" as const,
    tagline: "Our most portable voice canvas",
    badge: "NEW",
  },
  {
    name: "Storyou",
    accent: "Book",
    tone: "warm" as const,
    doodle: "squiggle" as const,
    tagline: "Our most enduring format",
  },
];

/* ---------- Page ---------- */
export default function Landing() {
  const { session } = useAuth();
  const ctaHref = session ? "/dashboard" : "/auth";
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
    <div className="min-h-screen bg-brand-bone text-brand-anchor overflow-x-hidden">
      <SEO
        title="Storyou — Made for storytelling."
        description="Move your voice from a spoken moment into keynotes, podcasts, books, and cinematic reimaginings — with an AI speaking coach built in."
        path="/landing"
      />

      <Nav />

      {/* ---------- HERO ---------- */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 lg:pt-14">
          <div className="relative rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-gradient-to-br from-[hsl(210,50%,90%)] via-[hsl(210,45%,86%)] to-[hsl(35,35%,88%)] min-h-[420px] sm:min-h-[560px] lg:min-h-[680px] flex">
            {/* decorative doodles */}
            <svg viewBox="0 0 400 200" className="absolute top-14 right-16 w-64 hidden md:block opacity-60 text-brand-anchor" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M20 100 Q 80 20, 160 80 T 320 60" />
              <circle cx="340" cy="70" r="6" />
              <path d="M60 140 q 30 -40 70 -10" />
            </svg>

            <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-14 lg:px-20 py-12 sm:py-20 max-w-3xl">
              <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-brass/25 px-3 py-1 text-xs font-medium text-brand-anchor w-fit">
                  Storyou Voice
                  <span className="rounded-full bg-brand-anchor text-brand-bone px-2 py-0.5 text-[10px]">NEW</span>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="mt-5 sm:mt-6 font-serif font-light tracking-tight leading-[0.98] text-[3rem] sm:text-7xl lg:text-8xl">
                  Made for
                  <br />
                  <span className="italic">storytelling</span>
                </h1>
              </Reveal>

              <Reveal delay={160}>
                <p className="mt-5 sm:mt-8 text-base sm:text-xl text-brand-anchor/70 max-w-xl leading-relaxed">
                  Move your voice easily from a spoken moment to keynote, podcast, book, and film — with an AI speaking coach built in.
                </p>
              </Reveal>

              <Reveal delay={240}>
                <div className="mt-7 sm:mt-10 flex flex-wrap gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full h-11 sm:h-12 px-5 sm:px-7 bg-brand-anchor text-brand-bone hover:bg-brand-anchor/90"
                  >
                    <Link to={ctaHref}>
                      Start your story <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full h-11 sm:h-12 px-5 sm:px-7 border-brand-anchor/20 bg-brand-bone/70 backdrop-blur hover:bg-brand-bone text-brand-anchor"
                  >
                    <a href="#features">Learn more</a>
                  </Button>
                </div>
              </Reveal>
            </div>

            {/* hero visual */}
            <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[46%]">
              <Reveal delay={200} className="h-full">
                <img
                  src={heroThinkerAsset.url}
                  alt="Person reflecting on a story to tell"
                  className="h-full w-full object-cover object-center"
                />
              </Reveal>
            </div>
          </div>

          {/* Mobile hero image */}
          <div className="lg:hidden mt-4">
            <img
              src={heroThinkerAsset.url}
              alt="Person reflecting on a story to tell"
              className="w-full h-56 sm:h-72 object-cover object-center rounded-[1.5rem]"
            />
          </div>
        </div>
      </section>

      {/* ---------- VALUE STRIP ---------- */}
      <section className="border-b border-brand-anchor/10 mt-14">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-brand-anchor/70">
          {[
            "Speak once, keep forever",
            "Try free for 14 days",
            "Cancel anytime",
          ].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-brass" />
              {s}
            </div>
          ))}
        </div>
      </section>

      {/* ---------- PRODUCT TRIO ---------- */}
      <section className="max-w-7xl mx-auto px-6 pt-20 lg:pt-28 pb-8">
        <Reveal>
          <div className="flex justify-center mb-10">
            <button className="rounded-full border border-brand-anchor/15 px-5 py-2 text-sm hover:bg-brand-anchor/5 transition-colors">
              Compare our story tools
            </button>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
          {PRODUCTS.map((p, i) => (
            <Reveal key={p.accent} delay={i * 100}>
              <article className="group flex flex-col h-full">
                <div className="relative">
                  <Placeholder
                    tone={p.tone}
                    aspect="aspect-[3/4]"
                    label={`${p.accent} scene`}
                    doodle={p.doodle}
                  />
                  {p.badge && (
                    <span className="absolute top-4 left-4 rounded-full bg-[hsl(140,45%,75%)] text-brand-anchor text-[10px] tracking-widest font-semibold px-3 py-1">
                      {p.badge}
                    </span>
                  )}
                </div>
                <div className="pt-8 pb-10 text-center">
                  <h3 className="font-serif text-3xl lg:text-4xl font-light tracking-tight leading-tight">
                    {p.name}
                    <br />
                    <span className="italic">{p.accent}</span>
                  </h3>
                  <p className="mt-4 text-brand-anchor/60 text-base">{p.tagline}</p>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-6 rounded-full border-brand-anchor/20 bg-brand-bone hover:bg-brand-anchor/5"
                  >
                    <Link to="/">Learn more</Link>
                  </Button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- EDITORIAL "WHAT IS STORYOU" ---------- */}
      <section className="bg-[hsl(35,25%,92%)] mt-16 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center text-xs uppercase tracking-[0.3em] text-brand-anchor/60 mb-20">
              What is Storyou?
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-3 gap-12 items-center mb-24">
            <Reveal className="lg:col-span-2">
              <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light leading-[1.08] tracking-tight">
                A voice studio that feels like<br />
                telling a story to a friend.
              </h2>
            </Reveal>
            <Reveal delay={120} className="hidden lg:block">
              <svg viewBox="0 0 200 200" className="w-40 mx-auto text-brand-anchor/70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M100 100 m-8 0 a8 8 0 1 1 16 0 a20 20 0 1 1 -40 0 a34 34 0 1 1 68 0 a50 50 0 1 1 -100 0 a66 66 0 1 1 132 0" />
              </svg>
            </Reveal>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 items-center">
            <Reveal className="hidden lg:block order-2 lg:order-1">
              <svg viewBox="0 0 220 100" className="w-52 text-brand-anchor/70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M10 70 C 70 10, 130 10, 200 55" />
                <path d="M185 40 L 202 57 L 182 63" />
              </svg>
            </Reveal>
            <Reveal delay={120} className="lg:col-span-2 order-1 lg:order-2 lg:text-right">
              <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light leading-[1.08] tracking-tight">
                It helps you tell better stories,<br />
                with smart tools that fit your voice.
              </h2>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- WHAT IT'S MADE FOR — ZIGZAG ---------- */}
      <section className="max-w-7xl mx-auto px-6 py-24 sm:py-32">
        <Reveal>
          <div className="text-center text-xs uppercase tracking-[0.3em] text-brand-anchor/60 mb-20">
            What is it made for?
          </div>
        </Reveal>

        <div className="space-y-16 sm:space-y-40">
          {FEATURES.map((f, i) => {
            const flipped = i % 2 === 1;
            return (
              <Reveal key={f.title}>
                <div
                  className={cn(
                    "grid lg:grid-cols-2 gap-10 lg:gap-20 items-center",
                    flipped && "lg:[&>*:first-child]:order-2"
                  )}
                >
                  <Placeholder
                    tone={f.tone}
                    aspect="aspect-[4/3]"
                    label={f.eyebrow}
                    doodle={f.doodle}
                  />
                  <div className="max-w-lg">
                    <div className="text-xs uppercase tracking-[0.25em] text-brand-brass mb-4">
                      {f.eyebrow}
                    </div>
                    <h2 className="font-serif text-4xl sm:text-5xl font-light tracking-tight leading-[1.05]">
                      {f.title}
                    </h2>
                    <p className="mt-6 text-base sm:text-lg text-brand-anchor/65 leading-relaxed">
                      {f.body}
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="mt-8 rounded-full border-brand-anchor/20 hover:bg-brand-anchor/5"
                    >
                      <Link to="/">
                        Learn more <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ---------- REIMAGINED / DARK VIDEO BAND ---------- */}
      <section className="bg-brand-anchor text-brand-bone py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center text-xs uppercase tracking-[0.3em] text-brand-bone/60 mb-8">
              Storyou Reimagined
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="font-serif text-center text-4xl sm:text-6xl font-light tracking-tight leading-tight mb-14">
              See a whisper become<br />
              <span className="italic text-brand-brass">a short film.</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-brand-bone/[0.06] flex items-center justify-center group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-bone/[0.04] to-brand-brass/10" />
              <div className="relative h-20 w-20 rounded-full bg-brand-bone/95 flex items-center justify-center transition-transform group-hover:scale-110">
                <Play className="h-7 w-7 text-brand-anchor ml-1" fill="currentColor" />
              </div>
              <span className="absolute bottom-6 left-6 text-[10px] tracking-[0.3em] uppercase text-brand-bone/50">
                Film placeholder
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- CONNECT / INTEGRATIONS SPLIT ---------- */}
      <section className="bg-brand-anchor text-brand-bone">
        <div className="max-w-7xl mx-auto px-6 py-24 sm:py-32 grid lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div className="text-xs uppercase tracking-[0.3em] text-brand-bone/60 mb-6">
              Join 10,000+ storytellers
            </div>
            <h2 className="font-serif text-4xl sm:text-6xl font-light tracking-tight leading-[1.05]">
              Connect to your<br />favorite tools
            </h2>
            <p className="mt-8 text-base sm:text-lg text-brand-bone/60 max-w-md leading-relaxed">
              Every Storyou plan includes recording, transcription, and cloud keepsakes.
              Upgrade to integrate with the tools you use every day and unlock a growing list of new features.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-brand-bone text-brand-anchor hover:bg-brand-bone/90 h-12 px-7">
                <Link to="/">Learn about Storyou</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-7 border-brand-bone/25 bg-transparent text-brand-bone hover:bg-brand-bone/10 hover:text-brand-bone">
                <Link to="/welcome">Pricing and plans</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* stacked floating cards */}
              <div className="absolute top-0 left-4 w-3/5 rotate-[-4deg]">
                <Placeholder tone="bone" aspect="aspect-[4/3]" label="Transcript" className="!bg-brand-bone/95 !text-brand-anchor/40" />
              </div>
              <div className="absolute top-16 right-0 w-1/2 rotate-[6deg]">
                <Placeholder tone="warm" aspect="aspect-square" label="Cover art" doodle="spiral" />
              </div>
              <div className="absolute bottom-0 left-8 w-2/3 rotate-[2deg]">
                <Placeholder tone="sky" aspect="aspect-[5/3]" label="Waveform" doodle="wave" />
              </div>
              <div className="absolute bottom-8 right-4 w-2/5 -rotate-[8deg]">
                <Placeholder tone="bone" aspect="aspect-square" label="Cloud" className="!bg-brand-bone/90 !text-brand-anchor/40" doodle="squiggle" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- TESTIMONIALS ---------- */}
      {testimonials.length > 0 && (
        <section className="border-t border-brand-anchor/10">
          <div className="max-w-7xl mx-auto px-6 py-24 sm:py-32">
            <Reveal>
              <div className="text-center mb-16">
                <div className="text-xs uppercase tracking-[0.3em] text-brand-brass mb-3">
                  Voices
                </div>
                <h2 className="font-serif text-4xl sm:text-5xl font-light tracking-tight">
                  From the storytellers.
                </h2>
              </div>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <Reveal key={t.id} delay={i * 80}>
                  <article className="rounded-3xl border border-brand-anchor/10 bg-brand-bone p-8 h-full">
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={cn(
                            "h-4 w-4",
                            idx < t.rating
                              ? "fill-brand-anchor text-brand-anchor"
                              : "text-brand-anchor/20"
                          )}
                        />
                      ))}
                    </div>
                    <p className="font-serif text-lg leading-relaxed">"{t.quote}"</p>
                    <div className="mt-5 text-sm">
                      <div className="font-medium">{t.name}</div>
                      {t.title && (
                        <div className="text-xs text-brand-anchor/55 mt-0.5">{t.title}</div>
                      )}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- FINAL CTA ---------- */}
      <section className="bg-brand-bone">
        <div className="max-w-4xl mx-auto px-6 py-24 sm:py-32 text-center">
          <Reveal>
            <img src={markAsset.url} alt="" className="h-10 w-auto mx-auto mb-8 opacity-90" />
          </Reveal>
          <Reveal delay={100}>
            <h2 className="font-serif text-4xl sm:text-6xl font-light tracking-tight leading-tight">
              The story you've yet to tell<br />
              <span className="italic text-brand-brass">is already yours.</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 text-base sm:text-lg text-brand-anchor/60 max-w-xl mx-auto">
              Begin with a single spoken sentence. Storyou takes it from there.
            </p>
          </Reveal>
          <Reveal delay={280}>
            <div className="mt-10">
              <Button
                asChild
                size="lg"
                className="rounded-full h-12 px-8 bg-brand-anchor text-brand-bone hover:bg-brand-anchor/90 text-base"
              >
                <Link to="/">
                  Get started <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
