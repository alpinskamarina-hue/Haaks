// Read-only star row, e.g. ★★★★☆. Half stars are rounded to the nearest whole star.
export function Stars({ value, className = "" }: { value: number; className?: string }) {
  const full = Math.round(value);
  return (
    <span className={`tracking-tight text-amber-500 ${className}`} aria-label={`${value} / 5`}>
      {"★".repeat(full)}
      <span className="text-slate-300">{"★".repeat(5 - full)}</span>
    </span>
  );
}
