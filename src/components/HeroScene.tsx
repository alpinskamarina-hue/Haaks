// Hero background: a Dutch street at sunset with a building going up and three
// builders in the foreground. Pure SVG, so it stays sharp and light on phones.

const HOUSES = [
  [0, 70, 170], [70, 60, 200], [130, 80, 160], [210, 64, 215], [274, 72, 180],
  [346, 58, 205], [404, 84, 165], [488, 62, 220], [550, 76, 175], [626, 60, 195],
  [686, 82, 160], [768, 66, 210], [834, 74, 170], [908, 62, 200], [970, 80, 185],
  [1050, 64, 215], [1114, 72, 165], [1186, 60, 205], [1246, 84, 180], [1330, 66, 210],
  [1396, 70, 175],
] as const;

// Gable shapes typical for Dutch canal houses.
function gable(x: number, w: number, h: number, kind: number) {
  const base = 700;
  const top = base - h;
  const mid = x + w / 2;
  if (kind === 0) return `M${x} ${base}V${top + 30}L${mid} ${top}L${x + w} ${top + 30}V${base}Z`;
  if (kind === 1) {
    const s = w / 6;
    return `M${x} ${base}V${top + 36}H${x + s}V${top + 24}H${x + 2 * s}V${top + 12}H${x + 4 * s}V${top + 24}H${x + 5 * s}V${top + 36}H${x + w}V${base}Z`;
  }
  return `M${x} ${base}V${top + 34}Q${x + w * 0.18} ${top + 34} ${x + w * 0.25} ${top + 16}Q${mid} ${top - 6} ${x + w * 0.75} ${top + 16}Q${x + w * 0.82} ${top + 34} ${x + w} ${top + 34}V${base}Z`;
}

type WorkerProps = {
  x: number;
  scale?: number;
  skin: string;
  hat: string;
  flip?: boolean;
  children?: React.ReactNode;
  back?: React.ReactNode;
  arms: React.ReactNode;
};

// One builder: boots, work trousers, hi-vis vest, hard hat.
function Worker({ x, scale = 1, skin, hat, flip, arms, back, children }: WorkerProps) {
  return (
    <g transform={`translate(${x} 770) scale(${flip ? -scale : scale} ${scale})`}>
      <ellipse cx="0" cy="2" rx="46" ry="7" fill="#020617" opacity=".55" />
      {back}
      <rect x="-22" y="-92" width="19" height="90" rx="7" fill="#1e293b" />
      <rect x="3" y="-92" width="19" height="90" rx="7" fill="#273449" />
      <rect x="-26" y="-12" width="26" height="13" rx="5" fill="#0c0a09" />
      <rect x="1" y="-12" width="27" height="13" rx="5" fill="#0c0a09" />
      <path d="M-30 -96 Q-32 -150 -18 -162 H18 Q32 -150 30 -96 Z" fill="#1d3557" />
      <path d="M-27 -96 Q-29 -146 -16 -158 H-6 V-96 Z M27 -96 Q29 -146 16 -158 H6 V-96 Z" fill="#f97316" />
      <rect x="-28" y="-128" width="22" height="6" fill="#fde68a" opacity=".9" />
      <rect x="6" y="-128" width="22" height="6" fill="#fde68a" opacity=".9" />
      <rect x="-28" y="-112" width="22" height="6" fill="#fde68a" opacity=".9" />
      <rect x="6" y="-112" width="22" height="6" fill="#fde68a" opacity=".9" />
      <rect x="-7" y="-170" width="14" height="12" rx="3" fill={skin} />
      <circle cx="0" cy="-184" r="17" fill={skin} />
      <path d="M-20 -186 A20 20 0 0 1 20 -186 Z" fill={hat} />
      <rect x="-24" y="-188" width="48" height="5" rx="2.5" fill={hat} />
      <path d="M-12 -201 A20 20 0 0 1 6 -205" stroke="#fff" strokeOpacity=".45" strokeWidth="3" fill="none" strokeLinecap="round" />
      {arms}
      {children}
    </g>
  );
}

const sleeve = { stroke: "#1d3557", strokeWidth: 14, strokeLinecap: "round" as const, fill: "none" };

export function HeroScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 800" preserveAspectRatio="xMaxYMax slice" className={className} aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1224" />
          <stop offset=".55" stopColor="#1e2a4a" />
          <stop offset=".8" stopColor="#7c2d12" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
        <radialGradient id="sun" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fdba74" />
          <stop offset=".45" stopColor="#fb923c" stopOpacity=".9" />
          <stop offset="1" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#111827" />
          <stop offset="1" stopColor="#030712" />
        </linearGradient>
        <linearGradient id="slab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#94a3b8" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
      </defs>

      <rect width="1440" height="800" fill="url(#sky)" />
      <circle cx="1040" cy="610" r="230" fill="url(#sun)" opacity=".75" />

      {/* Canal houses on the horizon */}
      <g fill="#131c33">
        {HOUSES.map(([x, w, h], i) => (
          <path key={x} d={gable(x, w, h, i % 3)} />
        ))}
      </g>
      <g fill="#fbbf24" opacity=".35">
        {HOUSES.flatMap(([x, w, h], i) =>
          [0, 1, 2].map((row) =>
            (i + row) % 2 === 0 ? (
              <rect key={`${x}-${row}`} x={x + w / 2 - 6} y={700 - h + 50 + row * 42} width="12" height="18" rx="2" />
            ) : null,
          ),
        )}
      </g>

      {/* Building under construction */}
      <g>
        {[870, 970, 1070, 1170].map((x) => (
          <rect key={x} x={x} y="330" width="16" height="370" fill="#334155" />
        ))}
        <g fill="#9a3412" opacity=".85">
          <rect x="886" y="622" width="84" height="78" />
          <rect x="986" y="622" width="84" height="78" />
          <rect x="1086" y="622" width="84" height="78" />
          <rect x="886" y="532" width="84" height="78" />
          <rect x="986" y="560" width="84" height="50" />
        </g>
        <g stroke="#7c2d12" strokeWidth="2" opacity=".6">
          {[640, 660, 680, 550, 570, 590].map((y) => (
            <line key={y} x1="886" x2={y < 600 ? 970 : 1170} y1={y} y2={y} />
          ))}
        </g>
        <g fill="#fcd34d" opacity=".55">
          <rect x="910" y="640" width="22" height="30" />
          <rect x="1110" y="640" width="22" height="30" />
        </g>
        {[700, 610, 520, 430, 340].map((y) => (
          <rect key={y} x="856" y={y - 12} width="340" height="14" fill="url(#slab)" />
        ))}
        <g stroke="#94a3b8" strokeWidth="3" opacity=".7">
          <line x1="1206" y1="330" x2="1206" y2="700" />
          <line x1="1246" y1="330" x2="1246" y2="700" />
          {[700, 655, 610, 565, 520, 475, 430, 385, 340].map((y) => (
            <line key={y} x1="1200" x2="1252" y1={y} y2={y} />
          ))}
          {[700, 610, 520, 430].map((y) => (
            <line key={y} x1="1206" y1={y} x2="1246" y2={y - 90} strokeWidth="2" />
          ))}
        </g>
      </g>

      {/* Tower crane */}
      <g stroke="#f59e0b" strokeWidth="4" fill="none">
        <line x1="1316" y1="700" x2="1316" y2="230" />
        <line x1="1344" y1="700" x2="1344" y2="230" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={i % 2 ? 1316 : 1344} y1={700 - i * 40} x2={i % 2 ? 1344 : 1316} y2={660 - i * 40} strokeWidth="2.5" />
        ))}
        <line x1="760" y1="230" x2="1440" y2="230" />
        <line x1="790" y1="256" x2="1316" y2="256" />
        {Array.from({ length: 13 }, (_, i) => (
          <line key={i} x1={790 + i * 40} y1="256" x2={810 + i * 40} y2="230" strokeWidth="2.5" />
        ))}
        <path d="M1316 230 L1330 160 L1344 230 M1330 160 L790 230 M1330 160 L1440 230" strokeWidth="2" />
      </g>
      <rect x="1350" y="210" width="70" height="46" rx="4" fill="#475569" />
      <rect x="1296" y="256" width="38" height="30" rx="4" fill="#fbbf24" />
      <rect x="1302" y="262" width="26" height="12" rx="2" fill="#0f172a" opacity=".6" />
      <line x1="900" y1="256" x2="900" y2="380" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M892 380 h16 l-4 12 a6 6 0 1 1 -8 0 z" fill="#cbd5e1" />
      <g transform="rotate(-4 900 410)">
        <rect x="830" y="398" width="140" height="14" fill="#dc2626" />
        <rect x="830" y="414" width="140" height="10" fill="#991b1b" />
        <line x1="900" y1="392" x2="840" y2="398" stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1="900" y1="392" x2="960" y2="398" stroke="#cbd5e1" strokeWidth="1.5" />
      </g>

      {/* Ground and building materials */}
      <rect y="700" width="1440" height="100" fill="url(#ground)" />
      <rect y="698" width="1440" height="4" fill="#f97316" opacity=".35" />
      <g>
        <rect x="1380" y="716" width="60" height="40" fill="#78350f" />
        <rect x="1380" y="716" width="60" height="6" fill="#a16207" />
        <rect x="1380" y="736" width="60" height="4" fill="#a16207" opacity=".7" />
        <path d="M760 770 l30 -52 l30 52 z" fill="#f97316" />
        <rect x="770" y="738" width="40" height="7" fill="#fff" opacity=".85" />
        <rect x="764" y="766" width="52" height="6" rx="2" fill="#1f2937" />
      </g>

      {/* Builders */}
      <Worker
        x={1000}
        skin="#c68642"
        hat="#facc15"
        arms={
          <>
            <path d="M-22 -150 Q-38 -128 -16 -118" {...sleeve} />
            <path d="M22 -150 Q36 -128 16 -118" {...sleeve} />
            <rect x="-26" y="-138" width="52" height="36" rx="4" fill="#e2e8f0" transform="rotate(-8 0 -120)" />
            <rect x="-21" y="-133" width="42" height="26" rx="2" fill="#38bdf8" opacity=".85" transform="rotate(-8 0 -120)" />
            <circle cx="-16" cy="-118" r="7" fill="#c68642" />
            <circle cx="16" cy="-118" r="7" fill="#c68642" />
          </>
        }
      />
      <Worker
        x={1150}
        scale={1.06}
        skin="#f1c27d"
        hat="#f97316"
        back={
          <g transform="rotate(-5 0 -170)">
            <rect x="-150" y="-180" width="270" height="14" rx="3" fill="#d97706" />
            <rect x="-150" y="-180" width="270" height="4" rx="2" fill="#fbbf24" />
          </g>
        }
        arms={
          <>
            <path d="M-22 -150 Q-44 -160 -40 -176" {...sleeve} />
            <path d="M22 -150 Q32 -120 26 -100" {...sleeve} />
            <circle cx="26" cy="-98" r="7" fill="#f1c27d" />
            <circle cx="-40" cy="-178" r="7" fill="#f1c27d" />
          </>
        }
      />
      <Worker
        x={1290}
        scale={0.98}
        skin="#8d5524"
        hat="#f8fafc"
        flip
        arms={
          <>
            <path d="M22 -150 Q34 -126 30 -100" {...sleeve} />
            <path d="M-22 -150 Q-30 -124 -26 -104" {...sleeve} />
            <circle cx="-26" cy="-100" r="7" fill="#8d5524" />
            <circle cx="30" cy="-98" r="7" fill="#8d5524" />
            <rect x="12" y="-92" width="44" height="30" rx="4" fill="#b91c1c" />
            <rect x="12" y="-92" width="44" height="7" rx="3" fill="#ef4444" />
            <path d="M24 -92 v-8 h20 v8" stroke="#1f2937" strokeWidth="4" fill="none" />
          </>
        }
      />
    </svg>
  );
}
