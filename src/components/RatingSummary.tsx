import { Stars } from "@/components/Stars";
import { CRITERIA, ratingText, type Criterion, type ratingSummary } from "@/lib/reviews";

// Big average with per-criterion bars, or "new" while there are fewer than 3 reviews.
export function RatingSummary({
  summary,
  criteria,
  averageText,
  newcomerText,
}: {
  summary: ReturnType<typeof ratingSummary>;
  criteria: Record<Criterion, string>;
  averageText: string;
  newcomerText: string;
}) {
  if (!summary.showAverage || summary.avg === null) {
    return <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">🆕 {newcomerText}</p>;
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold">{ratingText(summary.avg)}</span>
        <div>
          <Stars value={summary.avg} className="text-xl" />
          <p className="text-sm text-slate-500">{averageText.replace("{avg}", ratingText(summary.avg)).replace("{n}", String(summary.n))}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {CRITERIA.map((c) => {
          const v = summary.criteria[c];
          if (v === null) return null;
          return (
            <div key={c} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-2 text-sm">
              <span className="text-slate-600">{criteria[c]}</span>
              <span className="h-1.5 rounded-full bg-slate-200">
                <span className="block h-1.5 rounded-full bg-amber-500" style={{ width: `${(v / 5) * 100}%` }} />
              </span>
              <span className="text-right font-medium">{ratingText(v)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
