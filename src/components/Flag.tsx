// National flags as small inline SVGs, so they look the same on every phone and computer
// (Windows does not draw flag emoji). English uses the British flag.
import type { Lang } from "@/lib/i18n";

function Stripes({ colors, vertical }: { colors: string[]; vertical?: boolean }) {
  const size = 30 / colors.length;
  return (
    <>
      {colors.map((c, i) =>
        vertical ? (
          <rect key={i} x={i * size} y={0} width={size} height={20} fill={c} />
        ) : (
          <rect key={i} x={0} y={(i * 20) / colors.length} width={30} height={20 / colors.length} fill={c} />
        ),
      )}
    </>
  );
}

function UnionJack() {
  return (
    <>
      <rect width={30} height={20} fill="#012169" />
      <path d="M0 0L30 20M30 0L0 20" stroke="#fff" strokeWidth={4} />
      <path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" strokeWidth={1.6} />
      <path d="M15 0V20M0 10H30" stroke="#fff" strokeWidth={6} />
      <path d="M15 0V20M0 10H30" stroke="#C8102E" strokeWidth={3.4} />
    </>
  );
}

function Turkey() {
  return (
    <>
      <rect width={30} height={20} fill="#E30A17" />
      <circle cx={11} cy={10} r={5} fill="#fff" />
      <circle cx={12.25} cy={10} r={4} fill="#E30A17" />
      <polygon points="14.70,10.00 15.99,9.56 16.01,8.19 16.83,9.29 18.14,8.88 17.35,10.00 18.14,11.12 16.83,10.71 16.01,11.81 15.99,10.44" fill="#fff" />
    </>
  );
}

const FLAGS: Record<Lang, () => React.ReactNode> = {
  pl: () => <Stripes colors={["#fff", "#DC143C"]} />,
  ro: () => <Stripes colors={["#002B7F", "#FCD116", "#CE1126"]} vertical />,
  uk: () => <Stripes colors={["#0057B7", "#FFD700"]} />,
  ru: () => <Stripes colors={["#fff", "#0039A6", "#D52B1E"]} />,
  tr: () => <Turkey />,
  en: () => <UnionJack />,
  nl: () => <Stripes colors={["#AE1C28", "#fff", "#21468B"]} />,
};

export function Flag({ lang, className = "h-5 w-7" }: { lang: Lang; className?: string }) {
  return (
    <svg
      viewBox="0 0 30 20"
      className={`${className} shrink-0 overflow-hidden rounded-sm ring-1 ring-slate-300`}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      {FLAGS[lang]()}
    </svg>
  );
}
