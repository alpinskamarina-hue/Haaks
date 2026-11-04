import Link from "next/link";
import { notFound } from "next/navigation";
import { createInvoice } from "@/app/invoices-actions";
import { deleteQuote, setQuoteStatus } from "@/app/quotes-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CopyButton } from "@/components/CopyButton";
import { QuoteEditor } from "@/components/QuoteEditor";
import { QuoteStatusBadge } from "@/components/QuoteStatusBadge";
import { SendQuote } from "@/components/SendQuote";
import { siteUrl } from "@/lib/lang";
import { emailLink, quoteMessage, type Lead } from "@/lib/leads";
import type { Quote } from "@/lib/quotes";
import { loadWorkspace, signedUrls } from "@/lib/workspace";
import { templateGroups, templatePrices } from "@/lib/quote-templates";
import { daysSince, fill, getQuotesDict, reminderMessage } from "@/lib/quotes-i18n";
import { getWorkerDict } from "@/lib/worker-profile-text";
import { QuoteSteps } from "@/components/QuoteSteps";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile, lang, t } = await loadWorkspace();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .maybeSingle<Quote & { sent_at: string | null; viewed_at: string | null }>();
  if (!quote) notFound();
  const q = getQuotesDict(lang);

  const [{ data: order }, photos, { data: lead }, { data: recent }, { data: pastInvoices }, { data: invoice }] = await Promise.all([
    quote.order_id
      ? supabase.from("orders").select("id, title").eq("id", quote.order_id).maybeSingle()
      : Promise.resolve({ data: null }),
    signedUrls(supabase, quote.photo_paths),
    supabase
      .from("leads")
      .select("id, title, client_contact, source_url")
      .eq("quote_id", quote.id)
      .limit(1)
      .maybeSingle<Pick<Lead, "id" | "title" | "client_contact" | "source_url">>(),
    supabase
      .from("quotes")
      .select("lines, client_name, client_address")
      .eq("user_id", quote.user_id)
      .order("updated_at", { ascending: false })
      .limit(60)
      .returns<Pick<Quote, "lines" | "client_name" | "client_address">[]>(),
    supabase
      .from("invoices")
      .select("client_name, client_address")
      .eq("user_id", quote.user_id)
      .order("created_at", { ascending: false })
      .limit(60),
    supabase.from("invoices").select("id").eq("quote_id", quote.id).limit(1).maybeSingle(),
  ]);

  // Ready work lines: the worker's trades first, with their own last prices.
  const w = getWorkerDict(lang);
  const trades = ((profile as { trades?: string[] | null }).trades ?? []) as string[];
  const hourly = Number((profile as { hourly_rate?: number | string | null }).hourly_rate) || null;
  const groups = templateGroups(lang, trades, templatePrices(recent ?? []), hourly).map((g) => ({
    ...g,
    label: g.id === "general" ? q.general : ((w.trades as Record<string, string>)[g.id] ?? g.id),
  }));
  const clients = new Map<string, string | null>();
  for (const c of [...(recent ?? []), ...(pastInvoices ?? [])]) {
    const name = (c.client_name ?? "").trim();
    if (name && !clients.has(name)) clients.set(name, c.client_address ?? null);
  }
  const waitingDays = quote.status === "sent" ? daysSince(quote.sent_at ?? quote.updated_at) : 0;
  const link = `${await siteUrl()}/q/${quote.public_token}`;
  const message = quoteMessage({
    clientName: quote.client_name,
    title: quote.title,
    number: quote.number,
    link,
    workerName: profile.full_name,
  });
  const contact = lead?.client_contact ?? null;
  const subject = `Offerte ${quote.number}: ${quote.title}`;
  const email =
    emailLink(contact, subject, message) ?? `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  const button = "rounded-lg border border-slate-300 px-3 py-2 text-sm";
  const reminder = reminderMessage({ clientName: quote.client_name, title: quote.title, link, worker: profile.full_name });
  const reminderSubject = `Herinnering offerte ${quote.number}: ${quote.title}`;
  const reminderEmail =
    emailLink(contact, reminderSubject, reminder) ??
    `mailto:?subject=${encodeURIComponent(reminderSubject)}&body=${encodeURIComponent(reminder)}`;

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <Link
        href={order ? `/dashboard/orders/${order.id}` : lead ? `/dashboard/leads/${lead.id}` : "/dashboard/quotes"}
        className="text-sm text-slate-600 underline"
      >
        ← {order ? order.title : lead ? (lead.title ?? t.leadsTitle) : t.back}
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

        {quote.status !== "draft" && (
          <QuoteSteps
            title={q.stepsTitle}
            steps={[
              { label: q.stepSent, at: quote.sent_at ?? quote.updated_at },
              { label: q.stepViewed, at: quote.viewed_at ?? (quote.status === "accepted" ? quote.accepted_at : null) },
              { label: q.stepAccepted, at: quote.status === "accepted" ? quote.accepted_at : null },
              { label: q.stepInvoice, at: invoice ? "done" : null },
            ]}
            lang={lang}
          />
        )}
        {quote.status === "sent" && waitingDays >= 3 && (
          <div className="mt-4 rounded-xl border border-orange-300 bg-orange-50 p-4 text-sm">
            <p>
              ⏰ <b>{fill(q.remindTitle, { n: waitingDays })}</b> {q.remindText}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(reminder)}`}
                target="_blank"
                className="rounded-lg border border-orange-600 bg-white px-3 py-2 text-center font-semibold text-orange-700"
              >
                {q.remindWhatsapp}
              </a>
              <a href={reminderEmail} className="rounded-lg border border-orange-600 bg-white px-3 py-2 text-center font-semibold text-orange-700">
                {q.remindEmail}
              </a>
            </div>
          </div>
        )}
        {quote.status !== "accepted" && (
          <div className="mt-4 rounded-xl bg-orange-50 p-4">
            <h2 className="font-semibold">{quote.status === "draft" ? t.sendQuoteTitle : t.sendQuoteAgain}</h2>
            <p className="mb-3 mt-1 text-sm text-slate-700">
              {quote.status === "draft" && <b>{t.sendQuoteCheck} </b>}
              {t.sendQuoteHint}
            </p>
            <SendQuote
              lang={lang}
              quoteId={quote.id}
              message={message}
              email={email}
              original={lead?.source_url ?? null}
              labels={{
                whatsapp: "WhatsApp",
                email: "E-mail",
                copy: t.copyText,
                copied: t.sendQuoteCopied,
                original: t.sendQuoteOriginal,
              }}
            />
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-slate-600">{t.sendQuotePreview}</summary>
              <p className="mt-2 whitespace-pre-line break-words rounded-lg bg-white p-3">{message}</p>
            </details>
          </div>
        )}

        {quote.status === "accepted" && (
          <div className="mt-4">
            <p className="mb-1 text-sm font-medium">{t.clientLink}</p>
            <div className="flex gap-2">
              <input readOnly value={link} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
              <CopyButton value={link} />
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <a href={link} target="_blank" className={button}>
            {t.openAsClient}
          </a>
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
              {quote.status === "accepted" ? (
                <ConfirmButton message={t.confirmBackToDraft} className={button}>
                  {t.backToDraft}
                </ConfirmButton>
              ) : (
                <button className={button}>{t.backToDraft}</button>
              )}
            </form>
          )}
          {quote.status === "accepted" && (
            <form action={createInvoice}>
              <input type="hidden" name="quote_id" value={quote.id} />
              <SubmitButton className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {t.makeInvoice}
              </SubmitButton>
            </form>
          )}
          <form action={deleteQuote.bind(null, quote.id)}>
            <ConfirmButton message={t.confirmDeleteQuote} className={`${button} text-red-700`}>
              {t.delete}
            </ConfirmButton>
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
        <QuoteEditor
          t={t}
          quote={quote}
          presets={{ title: q.addWork, hint: q.myPrices, groups }}
          clients={[...clients].map(([name, address]) => ({ name, address }))}
          clientHint={q.clientHint}
        />
      </section>
    </main>
  );
}
