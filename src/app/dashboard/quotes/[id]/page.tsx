import Link from "next/link";
import { notFound } from "next/navigation";
import { createInvoice } from "@/app/invoices-actions";
import { deleteQuote, setQuoteStatus } from "@/app/quotes-actions";
import { CopyButton } from "@/components/CopyButton";
import { QuoteEditor } from "@/components/QuoteEditor";
import { QuoteStatusBadge } from "@/components/QuoteStatusBadge";
import { siteUrl } from "@/lib/lang";
import type { Quote } from "@/lib/quotes";
import { loadWorkspace, signedUrls } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, lang, t } = await loadWorkspace();

  const { data: quote } = await supabase.from("quotes").select("*").eq("id", id).maybeSingle<Quote>();
  if (!quote) notFound();

  const [{ data: order }, photos] = await Promise.all([
    quote.order_id
      ? supabase.from("orders").select("id, title").eq("id", quote.order_id).maybeSingle()
      : Promise.resolve({ data: null }),
    signedUrls(supabase, quote.photo_paths),
  ]);
  const link = `${await siteUrl()}/q/${quote.public_token}`;
  const button = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <Link href={order ? `/dashboard/orders/${order.id}` : "/dashboard/quotes"} className="text-sm text-slate-600 underline">
        ← {order ? order.title : t.back}
      </Link>

      <section className={card}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">{quote.number}</p>
            <h1 className="text-2xl font-bold">{quote.title}</h1>
          </div>
          <QuoteStatusBadge status={quote.status} t={t} />
        </div>
        {quote.status === "accepted" && quote.accepted_at && (
          <p className="mt-3 rounded-lg bg-green-50 p-3 text-green-800">
            ✓{" "}
            {t.acceptedBy
              .replace("{name}", quote.accepted_name ?? "—")
              .replace("{date}", new Date(quote.accepted_at).toLocaleDateString(lang))}
          </p>
        )}

        <div className="mt-4">
          <p className="mb-1 text-sm font-medium">{t.clientLink}</p>
          <div className="flex gap-2">
            <input readOnly value={link} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
            <CopyButton value={link} />
          </div>
          <p className="mt-1 text-xs text-slate-500">{t.clientLinkHint}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a href={link} target="_blank" className={button}>
            {t.openAsClient}
          </a>
          {quote.status === "draft" && (
            <form action={setQuoteStatus.bind(null, quote.id, "sent")}>
              <button className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white">{t.markSent}</button>
            </form>
          )}
          {quote.status === "sent" && (
            <>
              <form action={setQuoteStatus.bind(null, quote.id, "accepted")}>
                <button className={button}>{t.markAccepted}</button>
              </form>
              <form action={setQuoteStatus.bind(null, quote.id, "declined")}>
                <button className={button}>{t.markDeclined}</button>
              </form>
            </>
          )}
          {quote.status !== "draft" && (
            <form action={setQuoteStatus.bind(null, quote.id, "draft")}>
              <button className={button}>{t.backToDraft}</button>
            </form>
          )}
          {quote.status === "accepted" && (
            <form action={createInvoice}>
              <input type="hidden" name="quote_id" value={quote.id} />
              <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                {t.makeInvoice}
              </button>
            </form>
          )}
          <form action={deleteQuote.bind(null, quote.id)}>
            <button className={`${button} text-red-700`}>{t.delete}</button>
          </form>
        </div>
      </section>

      {quote.ai_notes.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="mb-2 font-semibold">⚠ {t.aiNotesTitle}</h2>
          <p className="mb-2 text-sm">{t.aiPriceWarning}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {quote.ai_notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      {(quote.work_description || photos.size > 0) && (
        <section className={card}>
          <h2 className="mb-2 font-semibold">{t.jobDescription}</h2>
          {quote.work_description && <p className="whitespace-pre-line text-sm text-slate-700">{quote.work_description}</p>}
          {photos.size > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {quote.photo_paths.map((p) =>
                photos.get(p) ? (
                  <li key={p}>
                    <a href={photos.get(p)} target="_blank">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photos.get(p)} alt="" className="h-20 w-20 rounded-lg object-cover" />
                    </a>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </section>
      )}

      <section className={card}>
        {quote.status !== "draft" && <p className="mb-3 text-sm text-amber-700">{t.editSentWarning}</p>}
        <QuoteEditor t={t} quote={quote} />
      </section>
    </main>
  );
}
