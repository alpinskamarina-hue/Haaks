import Link from "next/link";
import { RatingSummary } from "@/components/RatingSummary";
import { replyReview, reportReview } from "@/app/reviews-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { REVIEW_REPORT_REASONS } from "@/lib/reviews";
import { ReviewCard } from "@/components/ReviewCard";
import { ratingSummary, type Review } from "@/lib/reviews";
import { getReviewsDict } from "@/lib/reviews-i18n";
import { loadWorkspace } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export default async function ReviewsPage() {
  const { supabase, user, lang } = await loadWorkspace();
  const r = getReviewsDict(lang);
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("worker_id", user.id)
    .neq("status", "hidden")
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<Review[]>();
  const all = data ?? [];
  const received = all.filter((x) => x.status === "submitted");
  const waiting = all.filter((x) => x.status === "requested");
  const summary = ratingSummary(all);
  const now = new Date();
  const date = (iso: string) => new Date(iso).toLocaleString(lang, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <h1 className="text-2xl font-bold">{r.title}</h1>
      <p className="text-slate-600">{r.intro}</p>

      <section className={card}>
        <RatingSummary summary={summary} criteria={r.criteria} averageText={r.average} newcomerText={r.newcomer} />
      </section>

      <section className={card}>
        <h2 className="mb-3 text-lg font-semibold">
          {r.received} · {received.length}
        </h2>
        {received.length === 0 && <p className="text-slate-600">{r.none}</p>}
        <div className="space-y-3">
          {received.map((x) => (
            <div key={x.id} id={`review-${x.id}`}>
              <ReviewCard
                review={x}
                lang={lang}
                criteria={r.criteria}
                replyLabel={r.yourReply}
                note={
                  x.report_reason ? (
                    <p className="text-xs font-medium text-red-700">⚠️ {x.held ? r.reportedHeld : r.reported}</p>
                  ) : x.publish_at && new Date(x.publish_at) > now ? (
                    <p className="text-xs font-medium text-amber-700">⏳ {r.publishesOn.replace("{d}", date(x.publish_at))}</p>
                  ) : (
                    <p className="text-xs font-medium text-green-700">✓ {r.published}</p>
                  )
                }
              />
              {(!x.reply || !x.reported_at) && (
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  {!x.reply && (
                    <details className="w-full rounded-lg border border-slate-200 p-2 open:bg-slate-50">
                      <summary className="cursor-pointer font-medium text-orange-700">💬 {r.reply}</summary>
                      <form action={replyReview} className="mt-2 space-y-2">
                        <input type="hidden" name="id" value={x.id} />
                        <p className="text-xs text-slate-500">{r.replyHint}</p>
                        <textarea name="reply" required maxLength={600} className="min-h-20 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
                        <SubmitButton className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{r.replySend}</SubmitButton>
                      </form>
                    </details>
                  )}
                  {!x.reported_at && (
                    <details className="w-full rounded-lg border border-slate-200 p-2 open:bg-slate-50">
                      <summary className="cursor-pointer text-slate-500">⚑ {r.report}</summary>
                      <form action={reportReview} className="mt-2 space-y-2">
                        <input type="hidden" name="id" value={x.id} />
                        <p className="text-xs text-slate-500">{r.reportHint}</p>
                        {REVIEW_REPORT_REASONS.map((reason, i) => (
                          <label key={reason} className="flex items-center gap-2">
                            <input type="radio" name="reason" value={reason} defaultChecked={i === 0} />
                            {r.reasons[reason]}
                          </label>
                        ))}
                        <input name="note" maxLength={500} placeholder={r.reportNote} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
                        <SubmitButton className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-700 disabled:opacity-60">{r.reportSend}</SubmitButton>
                      </form>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {waiting.length > 0 && (
        <section className={card}>
          <h2 className="text-lg font-semibold">
            {r.waiting} · {waiting.length}
          </h2>
          <p className="mb-3 text-sm text-slate-600">{r.waitingHint}</p>
          <ul className="divide-y divide-slate-100">
            {waiting.map((x) => (
              <li key={x.id}>
                <Link href={`/dashboard/reviews/${x.id}`} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    <span className="block font-medium">{x.job_title}</span>
                    {x.client_name && <span className="text-sm text-slate-500">{x.client_name}</span>}
                  </span>
                  <span className="shrink-0 text-sm text-orange-700 underline">{r.open} →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
