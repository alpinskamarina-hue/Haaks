import type { Lang } from "@/lib/i18n";

// Where a sent quote is now: sent, opened by the client, Akkoord, invoice.
// at: when the step happened ("done" when only the fact is known), null when not yet.
export function QuoteSteps({ title, steps, lang }: { title: string; steps: { label: string; at: string | null }[]; lang: Lang }) {
  const when = (at: string) =>
    new Date(at).toLocaleString(lang, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const next = steps.findIndex((s) => !s.at);
  return (
    <div className="mt-4 rounded-xl border border-slate-200 p-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ol>
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-3 py-1.5 text-sm">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                s.at ? "bg-green-600 text-white" : i === next ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {s.at ? "✓" : i + 1}
            </span>
            <span className={s.at ? "text-slate-900" : "text-slate-500"}>
              {s.label}
              {s.at && s.at !== "done" && <span className="text-slate-500"> · {when(s.at)}</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
