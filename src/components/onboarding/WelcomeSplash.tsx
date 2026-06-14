import { useEffect, useState } from "react";
import keynoteIllustration from "@/assets/illustration-keynote.png";
import podcastIllustration from "@/assets/illustration-podcast.png";
import bookIllustration from "@/assets/illustration-book.png";

const SLIDES = [
  { title: "Remember", src: bookIllustration, alt: "Library of memories" },
  { title: "Recall", src: podcastIllustration, alt: "Recall through voice" },
  { title: "Reimagine", src: keynoteIllustration, alt: "Reimagine on stage" },
];

const SLIDE_MS = 6000; // 6s per slide (within the 5-7s range)

interface Props {
  onDone: () => void;
}

export function WelcomeSplash({ onDone }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= SLIDES.length) {
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIndex((i) => i + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, onDone]);

  const current = SLIDES[Math.min(index, SLIDES.length - 1)];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      role="dialog"
      aria-label="Welcome"
    >
      <button
        onClick={onDone}
        className="absolute top-6 right-6 text-xs uppercase tracking-[0.25em] text-foreground/50 hover:text-foreground transition-colors"
      >
        Skip
      </button>

      <div key={index} className="flex flex-col items-center animate-fade-in">
        <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl font-light tracking-tight mb-12">
          <em className="italic">{current.title}</em>
        </h1>
        <img
          src={current.src}
          alt={current.alt}
          className="w-56 sm:w-72 md:w-80 object-contain drop-shadow-sm"
        />
      </div>

      <div className="absolute bottom-10 flex gap-2">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === Math.min(index, SLIDES.length - 1)
                ? "w-8 bg-foreground"
                : "w-1.5 bg-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default WelcomeSplash;
