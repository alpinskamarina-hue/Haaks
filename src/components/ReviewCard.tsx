import { Stars } from "@/components/Stars";
import type { Lang } from "@/lib/i18n";
import { CRITERIA, reviewerShort, type Criterion, type Review } from "@/lib/reviews";
import { monthLabel } from "@/lib/works";

// One client review: stars, who and when, what job, the text, and the detail scores.
export function ReviewCard({
  review,
  lang,
  criteria,
  note,
  replyLabel,
}: {
  review: Review;
  lang: Lang;
  criteria: Record<Criterion, string>;
  note?: React.ReactNode;
  replyLabel?: string;
}) {
  const who = [reviewerShort(review.reviewer_name), review.reviewer_city, monthLabel(review.submitted_at?.slice(0, 10) ?? null, lang)]
    .filter(Boolean)
    .join(" · ");
  const details = CRITERIA.flatMap((c) => (review[c] ? [{ c, v: review[c] as number }] : []));
  return (
    <article className="space-y-1.5 border-t border-slate-100 pt-3 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-2">
        <Stars value={review.stars ?? 0} className="text-lg" />
        <span className="text-sm text-slate-500">{who}</span>
      </div>
      <p className="text-xs font-medium text-slate-500">{review.job_title}</p>
      {review.body && <p className="whitespace-pre-line text-sm text-slate-800">{review.body}</p>}
      {details.length > 0 && (
        <p className="flex flex-wrap gap-x-3 text-xs text-slate-500">
          {details.map((d) => (
            <span key={d.c}>
              {criteria[d.c]} <span className="text-amber-500">★</span>
              {d.v}
            </span>
          ))}
        </p>
      )}
      {review.reply && (
        <div className="rounded-lg border-l-4 border-orange-400 bg-slate-50 px-3 py-2 text-sm">
          {replyLabel && <p className="text-xs font-semibold text-slate-600">{replyLabel}</p>}
          <p className="whitespace-pre-line text-slate-700">{review.reply}</p>
        </div>
      )}
      {note}
    </article>
  );
}
