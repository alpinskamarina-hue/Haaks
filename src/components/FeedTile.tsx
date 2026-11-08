import Link from "next/link";

// One 3D tile of the feed sections: a raised colour button that sinks in when chosen or pressed.
export const TILE_COLORS = {
  all: { from: "#334155", to: "#0f172a", edge: "#020617" },
  jobs: { from: "#fb923c", to: "#ea580c", edge: "#9a3412" },
  soon: { from: "#4ade80", to: "#16a34a", edge: "#14532d" },
  tender: { from: "#60a5fa", to: "#2563eb", edge: "#1e3a8a" },
  business: { from: "#c084fc", to: "#9333ea", edge: "#581c87" },
  received: { from: "#fb7185", to: "#e11d48", edge: "#881337" },
  firms: { from: "#a78bfa", to: "#6d28d9", edge: "#3b0764" },
  helper: { from: "#7dd3fc", to: "#0284c7", edge: "#075985" },
} as const;

export function FeedTile({
  href,
  icon,
  label,
  count,
  plus,
  sub,
  color,
  active,
  dim,
  className = "",
}: {
  href: string;
  icon: string;
  label: string;
  count?: number;
  plus?: number;
  sub?: string;
  color: keyof typeof TILE_COLORS;
  active?: boolean;
  dim?: boolean;
  className?: string;
}) {
  const c = TILE_COLORS[color];
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative block min-h-[58px] rounded-xl px-1.5 pb-1.5 pt-1 text-center text-white transition-transform duration-75 active:translate-y-[3px] active:[box-shadow:0_1px_0_var(--edge),0_2px_4px_rgba(0,0,0,.25)] ${
        active ? "translate-y-[3px] outline outline-2 outline-offset-2 outline-amber-400" : ""
      } ${dim ? "opacity-60" : ""} ${className}`}
      style={
        {
          "--edge": c.edge,
          background: `linear-gradient(160deg, ${c.from}, ${c.to})`,
          boxShadow: active
            ? `0 1px 0 ${c.edge}, 0 2px 4px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.35)`
            : `0 4px 0 ${c.edge}, 0 6px 10px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.4)`,
        } as React.CSSProperties
      }
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-1 top-0.5 h-1/3 rounded-lg bg-gradient-to-b from-white/35 to-white/0" />
      {plus ? (
        <span className="absolute -right-1.5 -top-1.5 rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-extrabold text-white shadow-lg">+{plus}</span>
      ) : null}
      <span className="flex items-center justify-center gap-1">
        <span className="text-lg leading-none [filter:drop-shadow(0_2px_1px_rgba(0,0,0,.35))]">{icon}</span>
        {count !== undefined ? (
          <span className="text-lg font-extrabold leading-tight [text-shadow:0_1px_2px_rgba(0,0,0,.3)]">{count}</span>
        ) : sub ? (
          <span className="text-sm font-bold">{sub}</span>
        ) : null}
      </span>
      <span className="mt-0.5 block text-[11px] font-bold leading-tight [text-shadow:0_1px_1px_rgba(0,0,0,.3)]">{label}</span>
    </Link>
  );
}
