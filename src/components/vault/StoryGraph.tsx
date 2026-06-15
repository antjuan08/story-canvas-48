import { useEffect, useMemo, useRef, useState } from "react";
import type { Story } from "@/hooks/use-stories";
import { cn } from "@/lib/utils";

interface Props {
  stories: Story[];
  onSelect: (s: Story) => void;
  selectMode?: boolean;
  selectedIds?: Set<string>;
}

interface Node {
  id: string;
  story: Story;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  degree: number;
}

interface Edge { a: number; b: number; }

const PALETTE = [
  "hsl(48, 70%, 70%)",
  "hsl(150, 45%, 65%)",
  "hsl(25, 80%, 70%)",
  "hsl(270, 45%, 72%)",
  "hsl(200, 55%, 70%)",
  "hsl(340, 55%, 72%)",
];

const WIDTH = 1000;
const HEIGHT = 620;

function buildGraph(stories: Story[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = stories.map((s, i) => {
    const angle = (i / Math.max(1, stories.length)) * Math.PI * 2;
    const radius = 120 + Math.random() * 180;
    return {
      id: s.id,
      story: s,
      x: WIDTH / 2 + Math.cos(angle) * radius,
      y: HEIGHT / 2 + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      r: 5,
      color: PALETTE[i % PALETTE.length],
      degree: 0,
    };
  });

  const edges: Edge[] = [];
  const edgesPerNode: number[] = new Array(nodes.length).fill(0);
  const MAX_EDGES = 4;

  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i].story;
    const tagsA = new Set(a.tags ?? []);
    const candidates: { j: number; score: number }[] = [];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j].story;
      let score = 0;
      if (a.category && a.category === b.category) score += 2;
      for (const t of b.tags ?? []) if (tagsA.has(t)) score += 1;
      if (score > 0) candidates.push({ j, score });
    }
    candidates.sort((x, y) => y.score - x.score);
    for (const c of candidates) {
      if (edgesPerNode[i] >= MAX_EDGES) break;
      if (edgesPerNode[c.j] >= MAX_EDGES) continue;
      edges.push({ a: i, b: c.j });
      edgesPerNode[i]++;
      edgesPerNode[c.j]++;
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    nodes[i].degree = edgesPerNode[i];
    nodes[i].r = 5 + Math.min(8, edgesPerNode[i] * 1.4);
  }

  return { nodes, edges };
}

function simulate(nodes: Node[], edges: Edge[], ticks: number) {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  for (let t = 0; t < ticks; t++) {
    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) { d2 = 1; dx = Math.random(); dy = Math.random(); }
        const f = 900 / d2;
        const d = Math.sqrt(d2);
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      }
    }
    // Springs
    for (const e of edges) {
      const a = nodes[e.a], b = nodes[e.b];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - 90) * 0.04;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }
    // Gravity
    for (const n of nodes) {
      n.vx += (cx - n.x) * 0.005;
      n.vy += (cy - n.y) * 0.005;
      n.vx *= 0.78; n.vy *= 0.78;
      n.x += n.vx; n.y += n.vy;
      n.x = Math.max(40, Math.min(WIDTH - 40, n.x));
      n.y = Math.max(40, Math.min(HEIGHT - 40, n.y));
    }
  }
}

export function StoryGraph({ stories, onSelect, selectMode, selectedIds }: Props) {
  const [layout, setLayout] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const rafRef = useRef<number>();
  const layoutRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);

  const graphKey = useMemo(() => stories.map((s) => s.id).join("|"), [stories]);

  useEffect(() => {
    const g = buildGraph(stories);
    simulate(g.nodes, g.edges, 200);
    layoutRef.current = g;
    setLayout({ nodes: [...g.nodes], edges: g.edges });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphKey]);

  // Idle drift
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(50, now - last) / 16;
      last = now;
      const g = layoutRef.current;
      if (g) {
        for (const n of g.nodes) {
          n.vx += (Math.random() - 0.5) * 0.08;
          n.vy += (Math.random() - 0.5) * 0.08;
          n.vx *= 0.92; n.vy *= 0.92;
          n.x += n.vx * dt;
          n.y += n.vy * dt;
        }
        setLayout({ nodes: [...g.nodes], edges: g.edges });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  if (!layout || layout.nodes.length === 0) return null;

  const connected = new Set<number>();
  if (hover !== null) {
    connected.add(hover);
    for (const e of layout.edges) {
      if (e.a === hover) connected.add(e.b);
      if (e.b === hover) connected.add(e.a);
    }
  }

  return (
    <div className="relative w-full rounded-3xl border border-foreground/10 bg-background/40 overflow-hidden" style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="absolute inset-0 w-full h-full">
        {/* Edges */}
        <g>
          {layout.edges.map((e, i) => {
            const a = layout.nodes[e.a], b = layout.nodes[e.b];
            const active = hover !== null && (e.a === hover || e.b === hover);
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="currentColor"
                strokeWidth={active ? 1.2 : 0.6}
                className={cn(
                  "text-foreground transition-opacity duration-300",
                  hover === null ? "opacity-20" : active ? "opacity-60" : "opacity-5",
                )}
              />
            );
          })}
        </g>
        {/* Nodes */}
        <g>
          {layout.nodes.map((n, i) => {
            const isHover = hover === i;
            const isSelected = selectedIds?.has(n.id);
            const dim = hover !== null && !connected.has(i);
            const r = isHover ? Math.max(14, n.r * 2.2) : n.r;
            return (
              <g
                key={n.id}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h) => (h === i ? null : h))}
                onClick={() => onSelect(n.story)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r}
                  fill={n.color}
                  stroke={isSelected ? "hsl(var(--foreground))" : "hsl(var(--foreground) / 0.25)"}
                  strokeWidth={isSelected ? 2 : 0.5}
                  style={{ transition: "r 220ms ease, opacity 220ms ease", opacity: dim ? 0.25 : 1 }}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Hover card */}
      {hover !== null && (() => {
        const n = layout.nodes[hover];
        const left = Math.min(Math.max(n.x, 140), WIDTH - 140);
        const top = n.y - 18;
        const pct = (v: number, total: number) => `${(v / total) * 100}%`;
        return (
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-full animate-fade-in"
            style={{ left: pct(left, WIDTH), top: pct(top, HEIGHT) }}
          >
            <div className="rounded-2xl bg-background/95 backdrop-blur border border-foreground/10 shadow-lg px-4 py-3 w-64 text-left">
              {n.story.category && (
                <div className="text-[9px] uppercase tracking-widest text-foreground/50 mb-1">{n.story.category}</div>
              )}
              <div className="font-serif text-sm leading-tight mb-1 line-clamp-2">{n.story.title}</div>
              {n.story.body && (
                <div className="text-[11px] text-foreground/60 line-clamp-2">{n.story.body.slice(0, 120)}</div>
              )}
              {(n.story.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(n.story.tags ?? []).slice(0, 4).map((t) => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-foreground/10 text-foreground/70">#{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {selectMode && (
        <div className="absolute top-3 left-3 text-[10px] uppercase tracking-widest text-foreground/50 bg-background/70 backdrop-blur rounded-full px-2 py-1 border border-foreground/10">
          Click a node to select
        </div>
      )}
    </div>
  );
}
