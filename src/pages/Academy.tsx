import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GraduationCap, BookOpen, Mic, Sparkles } from "lucide-react";

const COURSES = [
  { icon: BookOpen, title: "Storycraft 101", body: "Find the shape inside any memory — beginnings, turns, and landings." },
  { icon: Mic, title: "The Spoken Voice", body: "Pacing, breath, and presence for talks, podcasts, and recordings." },
  { icon: Sparkles, title: "From Story to Stage", body: "Turn a single moment into a keynote your audience will remember." },
  { icon: GraduationCap, title: "Author's Path", body: "Compile your stories into chapters, then into a book worth keeping." },
];

export default function Academy() {
  return (
    <>
      <SEO
        title="StoryU Academy — Learn the craft of telling your story"
        description="Short courses and guides for storytellers — voice, structure, stage, and book."
        path="/academy"
      />
      <div className="max-w-5xl mx-auto">
        <header className="text-center py-10">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-foreground/50">
            <GraduationCap className="h-4 w-4" /> StoryU Academy
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-light tracking-tight mt-4">
            Learn to <em className="italic">tell</em> what only you can tell.
          </h1>
          <p className="text-foreground/60 mt-4 max-w-xl mx-auto">
            Short, beautiful lessons that turn your raw memories into stories worth listening to.
            New courses added every season.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 gap-5 mt-6">
          {COURSES.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-foreground/10 bg-background/60 p-6 hover:border-foreground/30 transition-colors"
            >
              <div className="h-10 w-10 rounded-full grid place-items-center bg-[hsl(var(--brand-aged-gold,42_70%_55%))]/15 text-[hsl(var(--brand-aged-gold,42_70%_55%))]">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-2xl mt-4">{title}</h2>
              <p className="text-sm text-foreground/65 mt-2 leading-relaxed">{body}</p>
              <Button variant="outline" size="sm" className="rounded-full mt-4">Coming soon</Button>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/dashboard" className="text-sm text-foreground/60 hover:text-foreground underline-offset-4 hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
