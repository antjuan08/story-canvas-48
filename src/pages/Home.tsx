import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const CREAM = "hsl(48, 56%, 95%)";
const INK = "hsl(240, 12%, 6%)";

export default function Home() {
  const [email, setEmail] = useState("");

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: INK, color: CREAM }}>
      {/* Top cream wavy curve */}
      <svg
        className="absolute top-0 left-0 w-full"
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        style={{ height: "14vh", minHeight: 100 }}
        aria-hidden
      >
        <path
          d="M0,0 L1440,0 L1440,80 C1200,150 960,20 720,70 C480,120 240,40 0,100 Z"
          fill={CREAM}
        />
      </svg>

      {/* Top nav */}
      <header className="absolute top-5 left-0 right-0 z-20 flex items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-2">
          <div
            className="h-9 w-9 rounded-2xl grid place-items-center font-serif text-base"
            style={{ backgroundColor: INK, color: CREAM }}
          >
            S
          </div>
          <span className="font-serif text-xl tracking-tight" style={{ color: INK }}>StoryYou</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link to="/auth" className="text-sm hover:opacity-70 transition" style={{ color: INK }}>Sign in</Link>
          <Link to="/auth">
            <Button className="rounded-full" style={{ backgroundColor: INK, color: CREAM }}>
              Get started
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero — black & white clouds animation */}
      <section className="relative z-10 pt-40 lg:pt-48 pb-24 px-6 lg:px-12 max-w-6xl mx-auto">
        <CloudsBW />

        <div className="relative mt-12 max-w-2xl">
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.02] tracking-tight">
            Your <em className="italic">stories</em>,
            <br />
            kept like <span className="inline-block px-2 rounded-md" style={{ backgroundColor: "rgba(245,243,238,0.12)", color: CREAM }}>clouds</span>.
          </h1>
          <p className="mt-6 text-base sm:text-lg max-w-lg" style={{ color: "hsl(48,30%,80%)" }}>
            Capture, shape, and revisit the moments worth remembering. A quiet, monochrome place for the
            stories you tell — and the ones you've yet to tell.
          </p>
        </div>
      </section>

      {/* Subscribe + footer (cream card on ink) */}
      <section className="relative z-10 px-6 lg:px-12 max-w-6xl mx-auto pb-32 grid lg:grid-cols-2 gap-12 items-start">
        <div className="rounded-[1.75rem] p-8 sm:p-10" style={{ backgroundColor: CREAM, color: INK }}>
          <h3 className="font-serif text-2xl sm:text-3xl">Join the StoryYou journal</h3>
          <p className="mt-3 text-sm" style={{ color: "hsl(240,8%,35%)" }}>
            Get the latest on <span className="px-1.5 rounded" style={{ backgroundColor: "hsl(0,0%,90%)" }}>craft</span>,{" "}
            <span className="px-1.5 rounded" style={{ backgroundColor: "hsl(0,0%,85%)" }}>memory</span>, and the journey from
            <span className="px-1.5 rounded ml-1" style={{ backgroundColor: "hsl(0,0%,80%)" }}>0→N</span> — in your inbox.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); }}
            className="mt-5 flex rounded-full overflow-hidden border"
            style={{ borderColor: "hsl(240,8%,80%)", backgroundColor: "white" }}
          >
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="border-0 rounded-none focus-visible:ring-0 bg-transparent flex-1"
            />
            <Button type="submit" className="rounded-none" style={{ backgroundColor: INK, color: CREAM }}>
              Subscribe
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-2">
          <div>
            <h4 className="font-serif text-lg mb-4" style={{ color: CREAM }}>Product</h4>
            <ul className="space-y-3 text-sm" style={{ color: "hsl(48,30%,80%)" }}>
              <li><Link to="/dashboard" className="hover:text-[hsl(48,56%,95%)]">Stories</Link></li>
              <li><Link to="/keynote" className="hover:text-[hsl(48,56%,95%)]">Keynote</Link></li>
              <li><Link to="/podcast" className="hover:text-[hsl(48,56%,95%)]">Podcast</Link></li>
              <li><Link to="/book" className="hover:text-[hsl(48,56%,95%)]">Book</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-lg mb-4" style={{ color: CREAM }}>Company</h4>
            <ul className="space-y-3 text-sm" style={{ color: "hsl(48,30%,80%)" }}>
              <li>About</li>
              <li>Contact</li>
              <li>Careers</li>
              <li>Privacy</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tree on a tire swing — bottom-right illustration */}
      <TreeSwingScene />

      {/* Bottom cream wavy curve */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ height: "9vh", minHeight: 60 }}
        aria-hidden
      >
        <path
          d="M0,120 L1440,120 L1440,40 C1180,100 940,10 700,55 C460,95 220,30 0,85 Z"
          fill={CREAM}
        />
      </svg>

      <div className="absolute bottom-3 left-6 text-xs z-20" style={{ color: INK }}>
        2026 © StoryYou Labs, Inc.
      </div>
    </div>
  );
}

/** Drifting black & white clouds */
function CloudsBW() {
  return (
    <div className="relative h-48 sm:h-56 w-full pointer-events-none">
      <style>{`
        @keyframes drift-x {
          0%   { transform: translateX(-10px); }
          50%  { transform: translateX(10px); }
          100% { transform: translateX(-10px); }
        }
        @keyframes drift-x-slow {
          0%   { transform: translateX(8px); }
          50%  { transform: translateX(-8px); }
          100% { transform: translateX(8px); }
        }
        @keyframes float-y {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
      `}</style>

      <Cloud className="absolute top-2 left-[5%] w-40 opacity-90" style={{ animation: "drift-x 14s ease-in-out infinite" }} />
      <Cloud className="absolute top-16 left-[28%] w-56 opacity-80" style={{ animation: "drift-x-slow 18s ease-in-out infinite" }} />
      <Cloud className="absolute top-4 right-[18%] w-48 opacity-95" style={{ animation: "drift-x 22s ease-in-out infinite" }} />
      <Cloud className="absolute top-24 right-[4%] w-36 opacity-70" style={{ animation: "float-y 8s ease-in-out infinite" }} />
      <Cloud className="absolute top-28 left-[12%] w-28 opacity-60" style={{ animation: "drift-x-slow 12s ease-in-out infinite" }} />
    </div>
  );
}

function Cloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 110" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(48,56%,95%)" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(48,30%,75%)" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path
        d="M40,80 C18,80 10,55 30,48 C28,28 58,18 72,32 C82,16 116,18 124,38 C148,30 172,46 168,66 C188,70 188,90 168,92 L48,92 C30,92 26,84 40,80 Z"
        fill="url(#cg)"
        stroke="hsl(240,12%,6%)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** Tree on a tire swing — line-art illustration with B&W palette */
function TreeSwingScene() {
  return (
    <svg
      className="hidden md:block absolute bottom-12 right-0 w-[42vw] max-w-[560px] pointer-events-none z-0"
      viewBox="0 0 560 420"
      aria-hidden
    >
      {/* cream blob ground */}
      <path
        d="M30,300 C20,220 110,160 200,180 C260,120 400,130 460,200 C540,210 570,290 510,340 C440,400 90,400 40,340 Z"
        fill="hsl(48, 56%, 95%)"
      />

      {/* tree trunk */}
      <path
        d="M300,140 C295,200 290,260 295,330 L325,330 C330,260 325,200 320,140 Z"
        fill="white"
        stroke="#111"
        strokeWidth="2.5"
      />
      {/* bark lines */}
      <path d="M305,180 q5,30 0,60" stroke="#111" strokeWidth="1.5" fill="none" />
      <path d="M315,170 q-4,40 0,80" stroke="#111" strokeWidth="1.5" fill="none" />

      {/* foliage — cloud-like canopy */}
      <g>
        <ellipse cx="310" cy="100" rx="120" ry="78" fill="white" stroke="#111" strokeWidth="2.5" />
        <ellipse cx="240" cy="115" rx="60" ry="48" fill="white" stroke="#111" strokeWidth="2.5" />
        <ellipse cx="390" cy="110" rx="70" ry="52" fill="white" stroke="#111" strokeWidth="2.5" />
        <ellipse cx="310" cy="60" rx="70" ry="42" fill="white" stroke="#111" strokeWidth="2.5" />
      </g>

      {/* branch holding the swing */}
      <path d="M360,150 q40,5 70,30" stroke="#111" strokeWidth="3" fill="none" />

      {/* swing rope */}
      <line x1="410" y1="178" x2="395" y2="280" stroke="#111" strokeWidth="2" />
      <line x1="445" y1="186" x2="455" y2="285" stroke="#111" strokeWidth="2" />

      {/* tire */}
      <g>
        <ellipse cx="425" cy="305" rx="48" ry="22" fill="#111" />
        <ellipse cx="425" cy="303" rx="48" ry="22" fill="white" stroke="#111" strokeWidth="2.5" />
        <ellipse cx="425" cy="303" rx="28" ry="12" fill="hsl(48, 56%, 95%)" stroke="#111" strokeWidth="2" />
        {/* tread marks */}
        <line x1="385" y1="298" x2="385" y2="312" stroke="#111" strokeWidth="1.5" />
        <line x1="405" y1="292" x2="405" y2="318" stroke="#111" strokeWidth="1.5" />
        <line x1="445" y1="292" x2="445" y2="318" stroke="#111" strokeWidth="1.5" />
        <line x1="465" y1="298" x2="465" y2="312" stroke="#111" strokeWidth="1.5" />
      </g>

      {/* gentle ground line */}
      <path d="M120,360 Q280,340 500,360" stroke="#111" strokeWidth="1.5" fill="none" />

      {/* small drifting cloud near tree */}
      <g opacity="0.9">
        <path
          d="M110,200 C95,200 90,185 105,180 C103,168 122,162 130,172 C138,160 160,164 162,178 C176,176 184,188 174,196 L120,196 C108,196 104,200 110,200 Z"
          fill="white" stroke="#111" strokeWidth="2"
        />
      </g>
    </svg>
  );
}
