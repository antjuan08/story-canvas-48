import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Globe2, FolderOpen, Plus, ArrowRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStories, gradeStory, type Story } from "@/hooks/use-stories";
import { usePresentations } from "@/hooks/use-presentations";
import { cn } from "@/lib/utils";

const GRADE_COLOR: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-blue-500",
  C: "bg-amber-500",
  D: "bg-rose-500",
};

export function Dashboard() {
  const navigate = useNavigate();
  const { stories, loading } = useStories();
  const { presentations } = usePresentations();

  const publicCount = stories.filter((s) => s.is_public).length;
  const grades = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0 } as Record<string, number>;
    stories.forEach((s) => { counts[gradeStory(s)]++; });
    return counts;
  }, [stories]);
  const total = stories.length || 1;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your storytelling, at a glance.</p>
        </div>
        <Button className="rounded-2xl gap-2 bg-gradient-primary" onClick={() => navigate("/vault")}>
          <Plus className="h-4 w-4" /> New story
        </Button>
      </div>

      {/* Rotating story carousel */}
      <StoryCarousel stories={stories} loading={loading} />

      {/* 3 count cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CountCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Stories in Vault"
          value={stories.length}
          to="/vault"
        />
        <CountCard
          icon={<Globe2 className="h-5 w-5" />}
          label="Shared publicly"
          value={publicCount}
          to="/storytellers"
        />
        <CountCard
          icon={<FolderOpen className="h-5 w-5" />}
          label="Presentations"
          value={presentations.length}
          to="/stage"
        />
      </div>

      {/* Grading panel */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Story Grades</h2>
          </div>
          <Link to="/vault" className="text-sm text-primary hover:underline flex items-center gap-1">
            View vault <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {stories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Save your first story to see how it grades.</p>
        ) : (
          <>
            <div className="flex h-3 w-full rounded-full overflow-hidden bg-secondary mb-4">
              {(["A", "B", "C", "D"] as const).map((g) =>
                grades[g] > 0 ? (
                  <div
                    key={g}
                    className={cn("h-full", GRADE_COLOR[g])}
                    style={{ width: `${(grades[g] / total) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {(["A", "B", "C", "D"] as const).map((g) => (
                <div key={g} className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn("h-2 w-2 rounded-full", GRADE_COLOR[g])} /> Grade {g}
                  </div>
                  <p className="text-2xl font-bold mt-1">{grades[g]}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CountCard({ icon, label, value, to }: { icon: React.ReactNode; label: string; value: number; to: string }) {
  return (
    <Link to={to} className="glass-card p-5 hover:shadow-apple-lg transition-apple group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-apple" />
      </div>
    </Link>
  );
}

function StoryCarousel({ stories, loading }: { stories: Story[]; loading: boolean }) {
  const [idx, setIdx] = useState(0);
  const featured = stories.slice(0, 8);

  useEffect(() => {
    if (featured.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % featured.length), 6000);
    return () => clearInterval(t);
  }, [featured.length]);

  if (loading) {
    return <div className="glass-card h-56 animate-pulse" />;
  }
  if (featured.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <h3 className="font-semibold text-lg mb-1">Welcome to StoryYou</h3>
        <p className="text-muted-foreground text-sm mb-4">Your Vault is empty. Add a story to get started.</p>
        <Link to="/vault" className="inline-flex">
          <Button className="rounded-2xl bg-gradient-primary"><Plus className="h-4 w-4 mr-1" /> Add a story</Button>
        </Link>
      </div>
    );
  }

  const s = featured[idx];
  const grade = gradeStory(s);

  return (
    <div className="relative glass-card overflow-hidden">
      <div className="grid md:grid-cols-2 gap-0 min-h-[14rem]">
        <div
          className="relative bg-gradient-primary min-h-[12rem]"
          style={s.image_url ? { backgroundImage: `url(${s.image_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        >
          {!s.image_url && (
            <div className="absolute inset-0 flex items-center justify-center text-white/80 text-5xl font-bold">
              {s.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="rounded-full">Grade {grade}</Badge>
              {s.category && <Badge variant="outline" className="rounded-full">{s.category}</Badge>}
              {s.is_public && <Badge className="rounded-full bg-green-500/15 text-green-600 hover:bg-green-500/15">Public</Badge>}
            </div>
            <h2 className="text-2xl font-bold mb-2 line-clamp-2">{s.title}</h2>
            <p className="text-muted-foreground text-sm line-clamp-3">{s.body || "No content yet — open in the Vault to write."}</p>
          </div>
          <div className="flex items-center justify-between mt-4">
            <Link to="/vault" className="text-sm text-primary hover:underline flex items-center gap-1">
              Open in Vault <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {featured.length > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setIdx((i) => (i - 1 + featured.length) % featured.length)} className="h-7 w-7 rounded-full hover:bg-accent flex items-center justify-center" aria-label="Previous">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-muted-foreground tabular-nums">{idx + 1}/{featured.length}</span>
                <button onClick={() => setIdx((i) => (i + 1) % featured.length)} className="h-7 w-7 rounded-full hover:bg-accent flex items-center justify-center" aria-label="Next">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
