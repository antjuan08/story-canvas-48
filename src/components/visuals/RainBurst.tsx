import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** A tiny drop-shower that fires every time the document theme class toggles. */
export function RainBurst({ className }: { className?: string }) {
  const [active, setActive] = useState(false);
  const [tick, setTick] = useState(0);
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const obs = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains("dark");
      setIsDark(dark);
      setTick((t) => t + 1);
      setActive(true);
      window.setTimeout(() => setActive(false), 1600);
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const dropColor = isDark ? "hsl(43, 51%, 58%)" : "hsl(43, 51%, 42%)";
  const drops = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute left-1/2 top-full -translate-x-1/2 w-24 h-16 transition-opacity",
        active ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      <style>{`
        @keyframes rain-drop {
          0% { transform: translateY(-8px); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(56px); opacity: 0; }
        }
      `}</style>
      {drops.map((i) => (
        <span
          key={`${tick}-${i}`}
          style={{
            left: `${(i / (drops.length - 1)) * 100}%`,
            background: dropColor,
            animation: active ? `rain-drop 1.4s ease-in ${i * 0.08}s` : "none",
          }}
          className="absolute top-0 w-[3px] h-[10px] rounded-full"
        />
      ))}
    </div>
  );
}
