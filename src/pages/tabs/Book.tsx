import { useState } from "react";
import { TabNav } from "@/components/nav/TabNav";
import { useStories } from "@/hooks/use-stories";
import { cn } from "@/lib/utils";

export default function Book() {
  const { stories } = useStories();
  const [idx, setIdx] = useState(0);
  const current = stories[idx];

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <TabNav active="Book" />
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-20 grid lg:grid-cols-[220px_1fr] gap-8">
        {/* Chapter list */}
        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="text-xs uppercase tracking-widest text-foreground/50 mb-3">Chapters</div>
          {stories.length === 0 ? (
            <p className="text-sm text-foreground/50">No chapters yet.</p>
          ) : (
            <ol className="space-y-1">
              {stories.map((s, i) => (
                <li key={s.id}>
                  <button
                    onClick={() => setIdx(i)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition",
                      i === idx ? "bg-foreground text-background" : "hover:bg-foreground/5 text-foreground/80",
                    )}
                  >
                    <span className="font-serif">{String(i + 1).padStart(2, "0")}. </span>
                    <span className="font-serif">{s.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </aside>

        {/* Book spread */}
        {current ? (
          <div className="relative">
            <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)] border border-foreground/10">
              {/* Left page */}
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
              {/* Right page */}
              <div className="bg-[hsl(48,30%,94%)] p-10 md:p-14 min-h-[70vh] relative border-l border-foreground/10">
                <p className="font-serif text-base leading-[1.85] text-foreground/85 whitespace-pre-wrap">
                  {(current.body ?? "").slice(700) || "…"}
                </p>
                {(current.tags ?? []).length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-2">
                    {current.tags!.map((t) => (
                      <span key={t} className="text-[10px] uppercase tracking-widest text-foreground/50 border border-foreground/20 rounded-full px-2 py-0.5">{t}</span>
                    ))}
                  </div>
                )}
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
    </div>
  );
}
