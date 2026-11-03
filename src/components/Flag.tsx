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

const FLAGS: Record<Lang, () => React.ReactNode> = {
  pl: () => <Stripes colors={["#fff", "#DC143C"]} />,
  ro: () => <Stripes colors={["#002B7F", "#FCD116", "#CE1126"]} vertical />,
  uk: () => <Stripes colors={["#0057B7", "#FFD700"]} />,
  ru: () => <Stripes colors={["#fff", "#0039A6", "#D52B1E"]} />,
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
