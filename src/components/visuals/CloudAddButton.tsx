import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** A cloud-shaped add button. Use centered on a page as the primary "add" affordance. */
export function CloudAddButton({
  onClick,
  label = "Add",
  className = "",
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "group relative inline-flex items-center justify-center transition-transform hover:scale-105 active:scale-95",
        className,
      )}
    >
      <style>{`
        @keyframes cab-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .cab-cloud { animation: cab-float 5s ease-in-out infinite; will-change: transform; }
      `}</style>
      <svg viewBox="0 0 200 110" className="cab-cloud w-44 drop-shadow-xl" aria-hidden>
        <path
          d="M40,80 C18,80 10,55 30,48 C28,28 58,18 72,32 C82,16 116,18 124,38 C148,30 172,46 168,66 C188,70 188,90 168,92 L48,92 C30,92 26,84 40,80 Z"
          fill="hsl(var(--foreground))"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.5"
        />
      </svg>
      <Plus className="absolute h-8 w-8 text-background pointer-events-none" />
      <span className="absolute -bottom-7 text-xs tracking-wide text-foreground/60 whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}
