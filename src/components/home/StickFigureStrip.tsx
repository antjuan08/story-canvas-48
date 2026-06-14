// Minimalist stick-figure scenes for the dashboard footer band.
// All strokes inherit currentColor so they invert with the theme.

const STROKE = "currentColor";

function Person({
  x, y, scale = 1, headR = 5, armA = -0.4, armB = 0.4, legA = 0.5, legB = -0.5,
}: {
  x: number; y: number; scale?: number; headR?: number;
  armA?: number; armB?: number; legA?: number; legB?: number;
}) {
  const s = scale;
  const r = headR * s;
  const body = 22 * s;
  const arm = 14 * s;
  const leg = 16 * s;
  return (
    <g stroke={STROKE} strokeWidth={1.6} strokeLinecap="round" fill="none">
      <circle cx={x} cy={y} r={r} />
      <line x1={x} y1={y + r} x2={x} y2={y + r + body} />
      <line x1={x} y1={y + r + body * 0.35} x2={x + Math.sin(armA) * arm} y2={y + r + body * 0.35 + Math.cos(armA) * arm} />
      <line x1={x} y1={y + r + body * 0.35} x2={x + Math.sin(armB) * arm} y2={y + r + body * 0.35 + Math.cos(armB) * arm} />
      <line x1={x} y1={y + r + body} x2={x + Math.sin(legA) * leg} y2={y + r + body + Math.cos(legA) * leg} />
      <line x1={x} y1={y + r + body} x2={x + Math.sin(legB) * leg} y2={y + r + body + Math.cos(legB) * leg} />
    </g>
  );
}

function Scene({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <svg viewBox="0 0 140 110" className="w-28 sm:w-32 md:w-36 h-auto text-foreground/70" aria-hidden>
        {children}
      </svg>
      <span className="text-[10px] uppercase tracking-widest text-foreground/40">{label}</span>
    </div>
  );
}

function Keynote() {
  return (
    <Scene label="Keynote">
      <Person x={70} y={28} armA={-1.1} armB={0.3} />
      {/* podium */}
      <g stroke={STROKE} strokeWidth={1.6} fill="none" strokeLinecap="round">
        <rect x={56} y={75} width={28} height={20} rx={1} />
        <line x1={60} y1={82} x2={80} y2={82} />
        <line x1={60} y1={88} x2={80} y2={88} />
      </g>
      {/* speech bubble */}
      <g stroke={STROKE} strokeWidth={1.4} fill="none">
        <path d="M88 24 q14 -2 16 8 q2 10 -12 12 l-3 4 l-1 -5 q-10 -2 -10 -10 q0 -8 10 -9 z" />
      </g>
    </Scene>
  );
}

function Podcast() {
  return (
    <Scene label="Podcast">
      <Person x={60} y={28} armA={-0.6} armB={0.6} />
      {/* mic */}
      <g stroke={STROKE} strokeWidth={1.6} fill="none" strokeLinecap="round">
        <rect x={95} y={42} width={10} height={18} rx={5} />
        <line x1={100} y1={60} x2={100} y2={72} />
        <line x1={92} y1={72} x2={108} y2={72} />
        <path d="M88 52 q12 14 24 0" />
      </g>
      {/* table */}
      <line x1={20} y1={95} x2={120} y2={95} stroke={STROKE} strokeWidth={1.4} />
    </Scene>
  );
}

function Library() {
  return (
    <Scene label="Library">
      {/* shelf with books */}
      <g stroke={STROKE} strokeWidth={1.6} fill="none" strokeLinecap="round">
        <line x1={20} y1={50} x2={120} y2={50} />
        <line x1={20} y1={80} x2={120} y2={80} />
        {/* top shelf books */}
        <rect x={26} y={28} width={6} height={22} />
        <rect x={34} y={32} width={6} height={18} />
        <rect x={42} y={26} width={6} height={24} />
        <rect x={52} y={34} width={8} height={16} />
        <rect x={64} y={28} width={6} height={22} />
        <rect x={74} y={30} width={6} height={20} />
        <rect x={84} y={26} width={6} height={24} />
        <rect x={94} y={32} width={6} height={18} />
        <rect x={104} y={28} width={6} height={22} />
        {/* bottom shelf books */}
        <rect x={26} y={58} width={6} height={22} />
        <rect x={34} y={62} width={8} height={18} />
        <rect x={46} y={56} width={6} height={24} />
        <rect x={56} y={62} width={6} height={18} />
        <rect x={66} y={58} width={8} height={22} />
        <rect x={78} y={60} width={6} height={20} />
        <rect x={88} y={56} width={6} height={24} />
        <rect x={98} y={62} width={8} height={18} />
      </g>
      {/* ground */}
      <line x1={16} y1={95} x2={124} y2={95} stroke={STROKE} strokeWidth={1.4} />
    </Scene>
  );
}

function Family() {
  return (
    <Scene label="Family">
      {/* couch base */}
      <g stroke={STROKE} strokeWidth={1.6} fill="none" strokeLinecap="round">
        <path d="M14 88 q0 -10 10 -10 h92 q10 0 10 10 v8 h-112 z" />
        <line x1={14} y1={88} x2={126} y2={88} />
      </g>
      {/* parent */}
      <Person x={42} y={32} scale={0.95} armA={-0.3} armB={0.5} legA={0.2} legB={-0.2} />
      {/* child */}
      <Person x={66} y={48} scale={0.65} armA={-0.4} armB={0.4} legA={0.3} legB={-0.3} />
      {/* second child */}
      <Person x={92} y={42} scale={0.75} armA={-0.4} armB={0.4} legA={0.3} legB={-0.3} />
      {/* shared open book */}
      <g stroke={STROKE} strokeWidth={1.4} fill="none">
        <path d="M50 70 q12 -4 24 0 q12 -4 24 0 l0 8 q-12 -4 -24 0 q-12 -4 -24 0 z" />
        <line x1={74} y1={70} x2={74} y2={78} />
      </g>
    </Scene>
  );
}

export function StickFigureStrip() {
  return (
    <div className="w-full px-4 sm:px-8 pb-6 pt-4">
      <div className="mx-auto max-w-6xl flex items-end justify-between gap-4 sm:gap-6 border-t border-foreground/10 pt-6">
        <Keynote />
        <Podcast />
        <Library />
        <Family />
      </div>
    </div>
  );
}
