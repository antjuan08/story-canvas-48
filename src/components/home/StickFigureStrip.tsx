import keynoteIllustration from "@/assets/illustration-keynote.png";
import podcastIllustration from "@/assets/illustration-podcast.png";
import bookIllustration from "@/assets/illustration-book.png";
import reimaginedIllustration from "@/assets/illustration-reimagined.png";

/**
 * Scattered, parallax-style band of the tab illustrations sitting just above the footer.
 * Sizes and positions vary so the row reads as a cascade rather than a uniform strip.
 */
export function StickFigureStrip() {
  const items = [
    {
      src: keynoteIllustration,
      alt: "Keynote speaker illustration",
      // far left, medium, slightly lifted
      className:
        "absolute left-[2%] bottom-10 w-28 sm:w-40 md:w-52 opacity-90 -rotate-[4deg]",
    },
    {
      src: bookIllustration,
      alt: "Book library illustration",
      // left-center, small, low
      className:
        "absolute left-[22%] bottom-2 w-20 sm:w-28 md:w-36 opacity-80 rotate-[3deg]",
    },
    {
      src: podcastIllustration,
      alt: "Podcast illustration",
      // center, large hero
      className:
        "absolute left-1/2 -translate-x-1/2 bottom-16 w-40 sm:w-56 md:w-72 opacity-95",
    },
    {
      src: reimaginedIllustration,
      alt: "Reimagined story illustration",
      // right-center, medium, low
      className:
        "absolute right-[20%] bottom-6 w-24 sm:w-36 md:w-48 opacity-85 -rotate-[2deg]",
    },
    {
      src: bookIllustration,
      alt: "",
      // far right echo, small + faded for depth
      className:
        "absolute right-[3%] bottom-14 w-20 sm:w-28 md:w-40 opacity-60 rotate-[5deg]",
    },
  ];

  return (
    <section
      aria-hidden="true"
      className="relative w-full h-48 sm:h-64 md:h-80 pointer-events-none select-none overflow-hidden"
    >
      {items.map((it, i) => (
        <img
          key={i}
          src={it.src}
          alt={it.alt}
          loading="lazy"
          className={`${it.className} object-contain drop-shadow-sm animate-fade-in`}
          style={{ animationDelay: `${i * 90}ms` }}
        />
      ))}
    </section>
  );
}

export default StickFigureStrip;
