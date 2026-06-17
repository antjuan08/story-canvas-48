import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface TourStep {
  selector: string;
  title: string;
  body: string;
  route?: string;
  placement?: "bottom" | "top" | "left" | "right";
}

const STEPS: TourStep[] = [
  {
    selector: '[data-tour="nav-dashboard"]',
    title: "Your dashboard",
    body: "Your home base — start a new story, see prompts, and pick up where you left off.",
    route: "/dashboard",
    placement: "bottom",
  },
  {
    selector: '[data-tour="nav-stories"]',
    title: "Stories",
    body: "Every story you capture lives here as a node in your cloud — drag, hover, and organize.",
    route: "/dashboard",
    placement: "bottom",
  },
  {
    selector: '[data-tour="nav-keynote"]',
    title: "Keynote",
    body: "Turn your stories into stage-ready talks with AI-assisted structure and feedback.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="nav-podcast"]',
    title: "Podcast",
    body: "Record episodes, generate intros, and shape your spoken voice into a series.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="nav-book"]',
    title: "Book",
    body: "Compile chapters from your stories — read them, or save the whole book to your library.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="nav-reimagined"]',
    title: "Reimagined",
    body: "See your stories rendered cinematically — a fresh lens on what you've already told.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="search"]',
    title: "Search anything",
    body: "Press ⌘K anywhere to jump to a story, keynote, or page in seconds.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="account"]',
    title: "Account & settings",
    body: "Manage your profile, billing, themes, and brand voice from here.",
    placement: "left",
  },
];

const STORAGE_KEY = "storyou:tour:v1";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TourGuide({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const navigate = useNavigate();

  const current = STEPS[step];

  useEffect(() => {
    if (!open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open || !current?.route) return;
    if (window.location.pathname !== current.route) navigate(current.route);
  }, [open, current, navigate]);

  useLayoutEffect(() => {
    if (!open) return;
    let raf = 0;
    const measure = () => {
      const el = document.querySelector(current.selector) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };
    measure();
    const t = setTimeout(measure, 250);
    const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      cancelAnimationFrame(raf);
    };
  }, [open, step, current]);

  if (!open) return null;

  const next = () => {
    if (step + 1 >= STEPS.length) finish();
    else setStep(step + 1);
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));
  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    onClose();
  };

  const pad = 8;
  const spot = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;

  // Card placement
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const cardW = Math.min(340, vw - 32);
  let cardStyle: React.CSSProperties = {
    position: "fixed",
    width: cardW,
    left: vw / 2 - cardW / 2,
    top: vh / 2 - 80,
  };
  if (spot) {
    const placement = current.placement ?? "bottom";
    if (placement === "bottom" && spot.top + spot.height + 180 < vh) {
      cardStyle.top = spot.top + spot.height + 12;
      cardStyle.left = Math.max(16, Math.min(vw - cardW - 16, spot.left + spot.width / 2 - cardW / 2));
    } else if (placement === "top" && spot.top - 180 > 0) {
      cardStyle.top = spot.top - 180;
      cardStyle.left = Math.max(16, Math.min(vw - cardW - 16, spot.left + spot.width / 2 - cardW / 2));
    } else if (placement === "left") {
      cardStyle.top = Math.max(16, spot.top + spot.height / 2 - 80);
      cardStyle.left = Math.max(16, spot.left - cardW - 12);
    } else {
      cardStyle.top = spot.top + spot.height + 12;
      cardStyle.left = Math.max(16, Math.min(vw - cardW - 16, spot.left + spot.width / 2 - cardW / 2));
    }
  }

  return (
    <div className="fixed inset-0 z-[200] animate-fade-in" role="dialog" aria-label="Tour guide">
      {/* Spotlight mask via 4 backdrops */}
      {spot ? (
        <>
          <div className="fixed bg-black/60 transition-all duration-300" style={{ top: 0, left: 0, right: 0, height: Math.max(0, spot.top) }} onClick={finish} />
          <div className="fixed bg-black/60 transition-all duration-300" style={{ top: spot.top, left: 0, width: Math.max(0, spot.left), height: spot.height }} onClick={finish} />
          <div className="fixed bg-black/60 transition-all duration-300" style={{ top: spot.top, left: spot.left + spot.width, right: 0, height: spot.height }} onClick={finish} />
          <div className="fixed bg-black/60 transition-all duration-300" style={{ top: spot.top + spot.height, left: 0, right: 0, bottom: 0 }} onClick={finish} />
          <div
            className="fixed rounded-xl ring-2 ring-[hsl(var(--brand-aged-gold,42_70%_55%))] pointer-events-none transition-all duration-300 shadow-[0_0_0_4px_rgba(255,255,255,0.15)]"
            style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/60" onClick={finish} />
      )}

      <div
        style={cardStyle}
        className="rounded-2xl bg-background border border-foreground/10 shadow-2xl p-5 animate-scale-in"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/50">
            Step {step + 1} of {STEPS.length}
          </div>
          <button
            onClick={finish}
            aria-label="Close tour"
            className="text-foreground/50 hover:text-foreground -mt-1 -mr-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="font-serif text-xl mt-2">{current.title}</h3>
        <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{current.body}</p>

        <div className="flex items-center justify-between mt-5 gap-2">
          <button
            onClick={finish}
            className="text-xs text-foreground/50 hover:text-foreground"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" className="rounded-full" onClick={prev}>
                Back
              </Button>
            )}
            <Button
              size="sm"
              className="rounded-full bg-[hsl(var(--brand-sermon-red,8_72%_52%))] text-white hover:bg-[hsl(var(--brand-sermon-red,8_72%_52%))]/90"
              onClick={next}
            >
              {step + 1 >= STEPS.length ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function hasSeenTour() {
  if (typeof window === "undefined") return true;
  return !!localStorage.getItem(STORAGE_KEY);
}

export function startTourFromAnywhere() {
  window.dispatchEvent(new CustomEvent("storyou:start-tour"));
}
