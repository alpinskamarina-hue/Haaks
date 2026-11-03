import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { ReviewCard } from "@/components/ReviewCard";
import { SendReview } from "@/components/SendReview";
import { siteUrl } from "@/lib/lang";
import { reviewMessage, type Review } from "@/lib/reviews";
import { getReviewsDict } from "@/lib/reviews-i18n";
import { loadWorkspace } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

// One review request: how to send the link, or the review itself once the client wrote it.
export default async function ReviewRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile, lang, t } = await loadWorkspace();
  const r = getReviewsDict(lang);
  const { data: review } = await supabase.from("reviews").select("*").eq("id", id).eq("worker_id", user.id).maybeSingle<Review>();
  if (!review) notFound();
  const link = `${await siteUrl()}/r/${review.token}`;
  const message = reviewMessage({ clientName: review.client_name, title: review.job_title, link, workerName: profile.full_name });
  const back = review.order_id ? `/dashboard/orders/${review.order_id}` : review.invoice_id ? `/dashboard/invoices/${review.invoice_id}` : "/dashboard/reviews";

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href={back} className="text-slate-600 underline">
          ← {t.back}
        </Link>
        <Link href="/dashboard/reviews" className="text-orange-700 underline">
          {r.nav} →
        </Link>
      </div>
      <section className={card}>
        <p className="text-sm text-slate-500">{r.from.replace("{job}", "")}</p>
        <h1 className="text-2xl font-bold">{review.job_title}</h1>
        {review.client_name && <p className="text-slate-600">{review.client_name}</p>}

        {review.status === "requested" ? (
          <div className="mt-4 rounded-xl bg-orange-50 p-4">
            <h2 className="font-semibold">{r.shareTitle}</h2>
            <p className="mb-3 mt-1 text-sm text-slate-700">{r.shareHint}</p>
            <SendReview lang={lang} message={message} subject={`Uw beoordeling: ${review.job_title}`} labels={{ email: r.email, copy: r.copyText, copied: r.copied }} />
            <p className="mb-1 mt-4 text-sm font-medium">{r.link}</p>
            <div className="flex gap-2">
              <input readOnly value={link} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
              <CopyButton value={link} />
            </div>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-slate-600">{r.preview}</summary>
              <p className="mt-2 whitespace-pre-line break-words rounded-lg bg-white p-3">{message}</p>
            </details>
          </div>
        ) : (
          <div className="mt-4">
            <ReviewCard review={review} lang={lang} criteria={r.criteria} replyLabel={r.yourReply} />
            <Link href={`/dashboard/reviews#review-${review.id}`} className="mt-3 inline-block text-sm text-orange-700 underline">
              {r.reply} / {r.report} →
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
