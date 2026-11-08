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
}) {
  const c = TILE_COLORS[color];
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative block min-h-[100px] rounded-2xl p-2.5 text-white transition-transform duration-75 active:translate-y-[5px] active:[box-shadow:0_2px_0_var(--edge),0_3px_6px_rgba(0,0,0,.25)] ${
        active ? "translate-y-[5px] outline outline-[3px] outline-offset-[3px] outline-amber-400" : ""
      } ${dim ? "opacity-60" : ""}`}
      style={
        {
          "--edge": c.edge,
          background: `linear-gradient(160deg, ${c.from}, ${c.to})`,
          boxShadow: active
            ? `0 2px 0 ${c.edge}, 0 3px 6px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.35)`
            : `0 7px 0 ${c.edge}, 0 12px 16px rgba(0,0,0,.22), inset 0 2px 0 rgba(255,255,255,.4)`,
        } as React.CSSProperties
      }
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-2 top-1 h-1/3 rounded-xl bg-gradient-to-b from-white/35 to-white/0" />
      {plus ? (
        <span className="absolute -right-2 -top-2 rounded-full border-2 border-white bg-red-600 px-1.5 text-xs font-extrabold text-white shadow-lg">+{plus}</span>
      ) : null}
      <span className="block text-2xl [filter:drop-shadow(0_3px_2px_rgba(0,0,0,.35))]">{icon}</span>
      <span className="mt-1 block text-[13px] font-bold leading-tight [text-shadow:0_1px_1px_rgba(0,0,0,.3)]">{label}</span>
      {count !== undefined ? (
        <span className="block text-2xl font-extrabold leading-tight [text-shadow:0_2px_2px_rgba(0,0,0,.3)]">{count}</span>
      ) : sub ? (
        <span className="block text-xs font-semibold opacity-90">{sub}</span>
      ) : null}
    </Link>
  );
}
