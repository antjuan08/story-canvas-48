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
  z: number; // pseudo-depth: -1 (far) → 1 (near)
  vx: number;
  vy: number;
  vz: number;
  r: number;
  color: string;
  degree: number;
}

interface Edge { a: number; b: number; }

// Brand palette — sermon red, brass, aged gold, with quiet neutrals
const PALETTE = [
  "hsl(var(--brand-brass))",
  "hsl(var(--brand-sermon-red))",
  "hsl(var(--brand-aged-gold))",
  "hsl(var(--brand-brass))",
  "hsl(var(--brand-smoke))",
  "hsl(var(--brand-aged-gold))",
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
      z: (Math.random() - 0.5) * 1.6,
      vx: 0,
      vy: 0,
      vz: 0,
      r: 3,
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
    nodes[i].r = 3 + Math.min(5, edgesPerNode[i] * 0.9);
  }

  return { nodes, edges };
}

function simulate(nodes: Node[], edges: Edge[], ticks: number) {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  for (let t = 0; t < ticks; t++) {
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
    for (const e of edges) {
      const a = nodes[e.a], b = nodes[e.b];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - 90) * 0.04;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }
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

// Project a z-depth into a scale factor (perspective)
function depthScale(z: number) {
  // z in [-1, 1]; near (z=1) → 1.3, far (z=-1) → 0.55
  return 0.55 + (z + 1) * 0.375;
}

export function StoryGraph({ stories, onSelect, selectMode, selectedIds }: Props) {
  const [layout, setLayout] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number>();
  const layoutRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const dragStateRef = useRef<{ idx: number; moved: boolean } | null>(null);

  const graphKey = useMemo(() => stories.map((s) => s.id).join("|"), [stories]);

  useEffect(() => {
    const g = buildGraph(stories);
    simulate(g.nodes, g.edges, 200);
    layoutRef.current = g;
    setLayout({ nodes: [...g.nodes], edges: g.edges });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphKey]);

  // Idle drift + slow z rotation for 3D feel
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(50, now - last) / 16;
      last = now;
      const g = layoutRef.current;
      if (g) {
        for (let i = 0; i < g.nodes.length; i++) {
          const n = g.nodes[i];
          if (dragStateRef.current?.idx === i) continue;
          n.vx += (Math.random() - 0.5) * 0.06;
          n.vy += (Math.random() - 0.5) * 0.06;
          n.vz += (Math.random() - 0.5) * 0.004;
          n.vx *= 0.92; n.vy *= 0.92; n.vz *= 0.96;
          n.x += n.vx * dt;
          n.y += n.vy * dt;
          n.z += n.vz * dt;
          if (n.z > 1) { n.z = 1; n.vz *= -0.5; }
          if (n.z < -1) { n.z = -1; n.vz *= -0.5; }
        }
        setLayout({ nodes: [...g.nodes], edges: g.edges });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const svgPointFromEvent = (e: React.PointerEvent | PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = pt.matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  useEffect(() => {
    if (dragIdx === null) return;
    const onMove = (e: PointerEvent) => {
      const g = layoutRef.current;
      if (!g) return;
      const p = svgPointFromEvent(e);
      const n = g.nodes[dragIdx];
      n.x = Math.max(20, Math.min(WIDTH - 20, p.x));
      n.y = Math.max(20, Math.min(HEIGHT - 20, p.y));
      n.vx = 0; n.vy = 0;
      if (dragStateRef.current) dragStateRef.current.moved = true;
      setLayout({ nodes: [...g.nodes], edges: g.edges });
    };
    const onUp = () => {
      const state = dragStateRef.current;
      const g = layoutRef.current;
      if (state && !state.moved && g) {
        onSelect(g.nodes[state.idx].story);
      }
      dragStateRef.current = null;
      setDragIdx(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragIdx, onSelect]);

  if (!layout || layout.nodes.length === 0) return null;

  const connected = new Set<number>();
  if (hover !== null) {
    connected.add(hover);
    for (const e of layout.edges) {
      if (e.a === hover) connected.add(e.b);
      if (e.b === hover) connected.add(e.a);
    }
  }

  // Sort indices by z for back-to-front painter's algorithm
  const order = layout.nodes.map((_, i) => i).sort((a, b) => layout.nodes[a].z - layout.nodes[b].z);

  return (
    <div
      className="relative w-full rounded-3xl border border-foreground/10 overflow-hidden"
      style={{
        aspectRatio: `${WIDTH} / ${HEIGHT}`,
        background:
          "radial-gradient(ellipse at center, hsl(var(--brand-bone) / 0.3) 0%, hsl(var(--background)) 70%)",
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: "none" }}
      >
        {/* Edges */}
        <g>
          {layout.edges.map((e, i) => {
            const a = layout.nodes[e.a], b = layout.nodes[e.b];
            const active = hover !== null && (e.a === hover || e.b === hover);
            const avgZ = (a.z + b.z) / 2;
            const edgeOpacity = 0.08 + (avgZ + 1) * 0.12;
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="hsl(var(--brand-brass))"
                strokeWidth={active ? 1.4 : 0.6}
                className="transition-opacity duration-300"
                style={{ opacity: hover === null ? edgeOpacity : active ? 0.7 : 0.04 }}
              />
            );
          })}
        </g>
        {/* Nodes — painted back-to-front by z */}
        <g>
          {order.map((i) => {
            const n = layout.nodes[i];
            const isHover = hover === i;
            const isSelected = selectedIds?.has(n.id);
            const dim = hover !== null && !connected.has(i);
            const scale = depthScale(n.z);
            const baseR = n.r * scale;
            const r = isHover ? Math.max(10, baseR * 2.6) : baseR;
            const nodeOpacity = dim ? 0.18 : 0.55 + (n.z + 1) * 0.225;
            return (
              <g
                key={n.id}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h) => (h === i ? null : h))}
                onPointerDown={(e) => {
                  e.preventDefault();
                  (e.target as Element).setPointerCapture?.(e.pointerId);
                  dragStateRef.current = { idx: i, moved: false };
                  setDragIdx(i);
                }}
                style={{ cursor: dragIdx === i ? "grabbing" : "grab" }}
              >
                {isHover && (
                  <circle cx={n.x} cy={n.y} r={r * 1.8} fill={n.color} opacity={0.12} />
                )}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r}
                  fill={n.color}
                  stroke={isSelected ? "hsl(var(--foreground))" : "hsl(var(--foreground) / 0.15)"}
                  strokeWidth={isSelected ? 1.5 : 0.4}
                  style={{ transition: "r 220ms ease, opacity 220ms ease", opacity: nodeOpacity }}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Hover card */}
      {hover !== null && (() => {
        const n = layout.nodes[hover];
        const left = Math.min(Math.max(n.x, 150), WIDTH - 150);
        const top = Math.max(n.y - 22, 40);
        const pct = (v: number, total: number) => `${(v / total) * 100}%`;
        return (
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-full animate-fade-in"
            style={{ left: pct(left, WIDTH), top: pct(top, HEIGHT) }}
          >
            <div className="rounded-2xl bg-background/95 backdrop-blur border border-[hsl(var(--brand-brass))]/30 shadow-xl px-3 py-2.5 w-56 text-left">
              {n.story.category && (
                <div className="text-[8px] uppercase tracking-[0.15em] text-[hsl(var(--brand-aged-gold))] mb-1 truncate">
                  {n.story.category}
                </div>
              )}
              <div className="font-serif text-[13px] leading-snug mb-1 line-clamp-2 break-words">
                {n.story.title}
              </div>
              {n.story.body && (
                <div className="text-[10px] text-foreground/60 leading-snug line-clamp-2 break-words">
                  {n.story.body.slice(0, 110)}
                </div>
              )}
              {(n.story.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(n.story.tags ?? []).slice(0, 3).map((t) => (
                    <span key={t} className="text-[8px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--brand-brass))]/15 text-[hsl(var(--brand-aged-gold))] truncate max-w-[80px]">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div className="absolute bottom-3 right-3 text-[9px] uppercase tracking-[0.18em] text-foreground/40 bg-background/60 backdrop-blur rounded-full px-2 py-1 border border-foreground/10">
        Drag nodes · Hover to expand
      </div>
      {selectMode && (
        <div className="absolute top-3 left-3 text-[10px] uppercase tracking-widest text-foreground/50 bg-background/70 backdrop-blur rounded-full px-2 py-1 border border-foreground/10">
          Click a node to select
        </div>
      )}
    </div>
  );
}
