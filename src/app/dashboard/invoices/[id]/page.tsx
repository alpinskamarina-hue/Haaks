import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteInvoice, setInvoiceStatus } from "@/app/invoices-actions";
import { CopyButton } from "@/components/CopyButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { InvoiceEditor } from "@/components/InvoiceEditor";
import { InvoiceStatusBadge } from "@/components/InvoiceStatusBadge";
import { SendInvoice } from "@/components/SendInvoice";
import { invoiceEmail, invoiceSubject, nextSendKind } from "@/lib/invoice-messages";
import { invoiceTotals, type Invoice } from "@/lib/invoices";
import { getInvoicesDict } from "@/lib/invoices-i18n";
import { fill } from "@/lib/quotes-i18n";
import { siteUrl } from "@/lib/lang";
import { loadWorkspace } from "@/lib/workspace";
import { requestReview } from "@/app/reviews-actions";
import { getReviewsDict } from "@/lib/reviews-i18n";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review?: string }>;
}) {
  const { id } = await params;
  const { review: reviewError } = await searchParams;
  const { supabase, profile, lang, t } = await loadWorkspace();
  const rv = getReviewsDict(lang);

  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle<Invoice>();
  if (!invoice) notFound();

  const { data: order } = invoice.order_id
    ? await supabase.from("orders").select("id, title").eq("id", invoice.order_id).maybeSingle()
    : { data: null };
  const { data: reviewRow } = await supabase
    .from("reviews")
    .select("id, status")
    .or(invoice.order_id ? `invoice_id.eq.${invoice.id},order_id.eq.${invoice.order_id}` : `invoice_id.eq.${invoice.id}`)
    .limit(1)
    .maybeSingle<{ id: string; status: string }>();
  const link = `${await siteUrl()}/f/${invoice.public_token}`;
  const button = "rounded-lg border border-slate-300 px-3 py-2 text-sm";
  const iv = getInvoicesDict(lang);
  const fmt = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString(lang, { day: "numeric", month: "short" });
  const company = profile.company_name || profile.full_name || "";
  const kind = nextSendKind(invoice);
  const today = new Date().toISOString().slice(0, 10);
  const overdue = invoice.status === "sent" && !!invoice.due_date && invoice.due_date < today;
  const message = invoiceEmail({
    kind,
    clientName: invoice.client_name,
    number: invoice.number,
    total: invoiceTotals(invoice.lines, invoice.vat_mode).incl,
    dueDate: invoice.due_date,
    sentAt: invoice.sent_at,
    remindedAt: invoice.reminded_at,
    link,
    iban: profile.iban ?? null,
    company,
    worker: profile.full_name ?? null,
  });
  const send =
    invoice.status === "paid" ? null : (
      <SendInvoice
        key={`${kind}|${message}|${invoice.client_email ?? ""}`}
        invoiceId={invoice.id}
        kind={kind}
        email={invoice.client_email ?? ""}
        subject={invoiceSubject(kind, invoice.number, company)}
        message={message}
        lang={lang}
        labels={{
          title: kind === "send" ? iv.sendTitle : kind === "reminder1" ? iv.rem1Title : iv.rem2Title,
          hint: kind === "send" ? iv.sendHint : kind === "reminder1" ? iv.rem1Hint : iv.rem2Hint,
          to: iv.to,
          placeholder: iv.toPlaceholder,
          text: iv.text,
          tr: kind === "send" ? iv.trSend : kind === "reminder1" ? iv.trRem1 : iv.trRem2,
          send: iv.sendEmail,
          note: iv.emailNote,
          copy: iv.copy,
          copied: iv.copied,
        }}
      />
    );

  // An invoice without these details is not valid in the Netherlands.
  const p = profile;
  const missing = [
    [!(p.company_name || p.full_name), t.companyName],
    [!p.business_address, t.businessAddress],
    [!p.kvk_number, t.kvkNumber],
    [!p.btw_number, t.btwNumber],
    [!p.iban, t.iban],
  ].flatMap(([isMissing, label]) => (isMissing ? [label as string] : []));

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <Link
        href={order ? `/dashboard/orders/${order.id}` : "/dashboard/invoices"}
        className="text-sm text-slate-600 underline"
      >
        ← {order ? order.title : t.back}
      </Link>

      {missing.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm">
          <p className="font-semibold">⚠ {t.invoiceMissingDetails}</p>
          <p className="mt-1">{missing.join(", ")}</p>
          <Link href="/dashboard/passport#profile" className="mt-2 inline-block underline">
            {t.fillProfile}
          </Link>
        </section>
      )}

      <section className={card}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">{t.invoice}</p>
            <h1 className="text-2xl font-bold">{invoice.number}</h1>
          </div>
          <InvoiceStatusBadge status={invoice.status} t={t} />
        </div>
        {invoice.status !== "draft" && (
          <p className="mt-2 text-sm text-slate-600">
            {[
              invoice.sent_at && fill(iv.sentInfo, { date: fmt(invoice.sent_at) }),
              invoice.reminder_count > 0 && invoice.reminded_at && fill(iv.remindedInfo, { n: invoice.reminder_count, date: fmt(invoice.reminded_at) }),
              invoice.viewed_at ? fill(iv.viewedInfo, { date: fmt(invoice.viewed_at) }) : invoice.status === "sent" ? iv.notViewedInfo : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {overdue && invoice.due_date && (
          <p className="mt-2 inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-semibold text-red-800">
            {fill(iv.overdue, { n: Math.round((Date.parse(today) - Date.parse(invoice.due_date)) / 864e5) })}
          </p>
        )}

        <div className="mt-4">
          <p className="mb-1 text-sm font-medium">{t.invoiceLink}</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={link}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            />
            <CopyButton value={link} />
          </div>
          <p className="mt-1 text-xs text-slate-500">{t.invoiceLinkHint}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a href={link} target="_blank" className={button}>
            🖨 {t.openInvoice}
          </a>
          {invoice.status === "draft" && (
            <form action={setInvoiceStatus.bind(null, invoice.id, "sent")}>
              <button className={button}>{iv.alreadySent}</button>
            </form>
          )}
          {invoice.status === "sent" && (
            <form action={setInvoiceStatus.bind(null, invoice.id, "paid")}>
              <button className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white">
                {t.markPaid}
              </button>
            </form>
          )}
          {invoice.status !== "draft" && (
            <form action={setInvoiceStatus.bind(null, invoice.id, "draft")}>
              <button className={button}>{t.backToDraft}</button>
            </form>
          )}
          {/* A sent or paid invoice is kept: its number must stay in the sequence. */}
          {invoice.status === "draft" && (
            <form action={deleteInvoice.bind(null, invoice.id)}>
              <ConfirmButton message={t.confirmDeleteInvoice} className={`${button} text-red-700`}>
                {t.delete}
              </ConfirmButton>
            </form>
          )}
        </div>
      </section>

      {invoice.status === "sent" && send}

      {(reviewRow || invoice.status !== "draft") && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          {reviewRow ? (
            <Link href={`/dashboard/reviews/${reviewRow.id}`} className="font-semibold text-amber-900 underline">
              ⭐ {reviewRow.status === "requested" ? rv.open : rv.nav}
            </Link>
          ) : (
            <>
              <p className="text-sm text-amber-900">{rv.askHint}</p>
              <form action={requestReview} className="mt-2">
                <input type="hidden" name="invoice" value={invoice.id} />
                <button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white">{rv.ask}</button>
              </form>
            </>
          )}
          {reviewError && <p className="mt-2 text-sm text-red-700">{rv.notAllowed}</p>}
        </section>
      )}

      <section className={card}>
        {invoice.status !== "draft" && <p className="mb-3 text-sm text-amber-700">{t.editSentInvoice}</p>}
        <InvoiceEditor t={t} invoice={invoice} />
      </section>
      {invoice.status === "draft" && send}
    </main>
  );
}
