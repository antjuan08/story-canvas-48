/** Animated drifting clouds. Variants: "dark" (cream clouds on dark), "light" (ink clouds on cream), "white" (white clouds, transparent bg). */
import { RainBurst } from "./RainBurst";

type Variant = "dark" | "light" | "white";
type Tint = "default" | "brass" | "aged-gold" | "sermon-red";

const TINT_FILL: Record<Tint, string | null> = {
  default: null,
  brass: "hsl(43, 51%, 48%)",
  "aged-gold": "hsl(44, 65%, 30%)",
  "sermon-red": "hsl(4, 58%, 41%)",
};

export function CloudsBackdrop({ className = "", variant = "dark" }: { className?: string; variant?: Variant }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <style>{`
        @keyframes cb-drift-1 { 0%,100% { transform: translateX(-30px); } 50% { transform: translateX(30px); } }
        @keyframes cb-drift-2 { 0%,100% { transform: translateX(20px); } 50% { transform: translateX(-20px); } }
        @keyframes cb-float   { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
      `}</style>
      <Cloud v={variant} className="absolute top-[8%] left-[6%] w-44 opacity-90" style={{ animation: "cb-drift-1 22s ease-in-out infinite" }} />
      <Cloud v={variant} tint="brass" className="absolute top-[14%] left-[40%] w-64 opacity-60" style={{ animation: "cb-drift-2 28s ease-in-out infinite" }} />
      {/* Right-side cloud sprinkles drops on every theme inversion */}
      <div className="absolute top-[6%] right-[10%] w-52" style={{ animation: "cb-drift-1 26s ease-in-out infinite" }}>
        <Cloud v={variant} tint="sermon-red" className="w-full opacity-70" />
        <RainBurst />
      </div>
      <Cloud v={variant} tint="aged-gold" className="absolute top-[38%] left-[18%] w-36 opacity-55" style={{ animation: "cb-float 10s ease-in-out infinite" }} />
      <Cloud v={variant} className="absolute top-[44%] right-[22%] w-48 opacity-65" style={{ animation: "cb-drift-2 32s ease-in-out infinite" }} />
      <Cloud v={variant} tint="brass" className="absolute bottom-[18%] left-[8%] w-40 opacity-55" style={{ animation: "cb-drift-1 30s ease-in-out infinite" }} />
      <Cloud v={variant} className="absolute bottom-[10%] right-[14%] w-56 opacity-55" style={{ animation: "cb-float 14s ease-in-out infinite" }} />
      <Cloud v={variant} tint="aged-gold" className="absolute bottom-[28%] left-[50%] w-32 opacity-50" style={{ animation: "cb-drift-2 24s ease-in-out infinite" }} />
    </div>
  );
}

function Cloud({ v, tint = "default", className, style }: { v: Variant; tint?: Tint; className?: string; style?: React.CSSProperties }) {
  // light = charcoal clouds on cream/off-white bg; dark/white = white clouds on dark bg
  const baseFill = v === "light" ? "hsl(240, 6%, 28%)" : "#ffffff";
  const baseStroke = v === "light" ? "hsl(240, 6%, 18%)" : "hsl(240, 8%, 70%)";
  const tintFill = TINT_FILL[tint];
  const fill = tintFill ?? baseFill;
  const stroke = tintFill ? tintFill : baseStroke;
  return (
    <svg viewBox="0 0 200 110" className={className} style={style} aria-hidden>
      <path
        d="M40,80 C18,80 10,55 30,48 C28,28 58,18 72,32 C82,16 116,18 124,38 C148,30 172,46 168,66 C188,70 188,90 168,92 L48,92 C30,92 26,84 40,80 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
    </svg>
  );
}
