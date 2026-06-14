/** Animated drifting clouds. Variants: "dark" (cream clouds on dark), "light" (ink clouds on cream), "white" (white clouds, transparent bg). */
type Variant = "dark" | "light" | "white";

export function CloudsBackdrop({ className = "", variant = "dark" }: { className?: string; variant?: Variant }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <style>{`
        @keyframes cb-drift-1 { 0%,100% { transform: translateX(-30px); } 50% { transform: translateX(30px); } }
        @keyframes cb-drift-2 { 0%,100% { transform: translateX(20px); } 50% { transform: translateX(-20px); } }
        @keyframes cb-float   { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
      `}</style>
      <Cloud v={variant} className="absolute top-[8%] left-[6%] w-44 opacity-90" style={{ animation: "cb-drift-1 22s ease-in-out infinite" }} />
      <Cloud v={variant} className="absolute top-[14%] left-[40%] w-64 opacity-70" style={{ animation: "cb-drift-2 28s ease-in-out infinite" }} />
      <Cloud v={variant} className="absolute top-[6%] right-[10%] w-52 opacity-85" style={{ animation: "cb-drift-1 26s ease-in-out infinite" }} />
      <Cloud v={variant} className="absolute top-[38%] left-[18%] w-36 opacity-60" style={{ animation: "cb-float 10s ease-in-out infinite" }} />
      <Cloud v={variant} className="absolute top-[44%] right-[22%] w-48 opacity-65" style={{ animation: "cb-drift-2 32s ease-in-out infinite" }} />
      <Cloud v={variant} className="absolute bottom-[18%] left-[8%] w-40 opacity-70" style={{ animation: "cb-drift-1 30s ease-in-out infinite" }} />
      <Cloud v={variant} className="absolute bottom-[10%] right-[14%] w-56 opacity-55" style={{ animation: "cb-float 14s ease-in-out infinite" }} />
      <Cloud v={variant} className="absolute bottom-[28%] left-[50%] w-32 opacity-50" style={{ animation: "cb-drift-2 24s ease-in-out infinite" }} />
    </div>
  );
}

function Cloud({ v, className, style }: { v: Variant; className?: string; style?: React.CSSProperties }) {
  // light = charcoal clouds on cream/off-white bg; dark/white = white clouds on dark bg
  const fill = v === "light" ? "hsl(240, 6%, 28%)" : "#ffffff";
  const stroke = v === "light" ? "hsl(240, 6%, 18%)" : "hsl(240, 8%, 70%)";
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
