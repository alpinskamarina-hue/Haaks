import Link from "next/link";
import { notFound } from "next/navigation";
import { correctInvoice, deleteInvoice, setInvoiceStatus } from "@/app/invoices-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { nextInvoiceNumber } from "@/lib/invoices";
import { euro } from "@/lib/orders";
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
  // Credit notes: the invoice this one cancels, its credit note, the corrected copy, the one it replaces.
  const relatedIds = [invoice.credit_for, invoice.credited_by, invoice.replaces].filter(Boolean) as string[];
  const [{ data: relatedRows }, { data: copyRow }, { data: numberRows }] = await Promise.all([
    relatedIds.length
      ? supabase.from("invoices").select("id, number, public_token, credited_by").in("id", relatedIds)
      : Promise.resolve({ data: [] as { id: string; number: string; public_token: string; credited_by: string | null }[] }),
    invoice.credited_by
      ? supabase.from("invoices").select("id, number").eq("replaces", invoice.id).limit(1).maybeSingle<{ id: string; number: string }>()
      : Promise.resolve({ data: null }),
    invoice.status !== "draft" && !invoice.credit_for && !invoice.credited_by
      ? supabase.from("invoices").select("number").eq("user_id", invoice.user_id)
      : Promise.resolve({ data: null }),
  ]);
  const related = new Map((relatedRows ?? []).map((r) => [r.id, r]));
  const site = await siteUrl();
  const link = `${site}/f/${invoice.public_token}`;
  const replaced = invoice.replaces ? related.get(invoice.replaces) : undefined;
  const replacedCredit = replaced?.credited_by
    ? (await supabase.from("invoices").select("number, public_token").eq("id", replaced.credited_by).maybeSingle<{ number: string; public_token: string }>()).data
    : null;
  const closed = !!invoice.credit_for || !!invoice.credited_by;
  const fixNumbers = numberRows ? (() => { const used = numberRows.map((n) => n.number); const c = nextInvoiceNumber(used); return [c, nextInvoiceNumber([...used, c])]; })() : null;
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
    payLink: profile.pay_link ?? null,
    company,
    worker: profile.full_name ?? null,
    credit:
      replaced && replacedCredit
        ? `Deze factuur vervangt factuur ${replaced.number}. Die is gecrediteerd met creditfactuur ${replacedCredit.number}: ${site}/f/${replacedCredit.public_token}`
        : null,
  });
  const send =
    invoice.status === "paid" || closed ? null : (
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
            <p className="text-sm text-slate-500">{invoice.credit_for ? iv.badgeCredit : t.invoice}</p>
            <h1 className="text-2xl font-bold">{invoice.number}</h1>
          </div>
          {closed ? (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">{invoice.credit_for ? iv.badgeCredit : iv.badgeCancelled}</span>
          ) : (
            <InvoiceStatusBadge status={invoice.status} t={t} />
          )}
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
        {invoice.status === "sent" && !closed && <p className="mt-1 text-xs text-slate-500">⏰ {iv.autoInfo}</p>}
        {invoice.credit_for && (
          <p className="mt-3 rounded-xl bg-slate-100 p-3 text-sm">{fill(iv.creditInfo, { number: related.get(invoice.credit_for)?.number ?? "—" })}</p>
        )}
        {invoice.credited_by && (
          <p className="mt-3 rounded-xl bg-slate-100 p-3 text-sm">
            {fill(iv.cancelledInfo, { credit: related.get(invoice.credited_by)?.number ?? "—" })}{" "}
            {copyRow && (
              <Link href={`/dashboard/invoices/${copyRow.id}`} className="font-semibold underline">
                {copyRow.number} →
              </Link>
            )}
          </p>
        )}
        {replaced && <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">{fill(iv.replacesInfo, { number: replaced.number })}</p>}
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
          {invoice.status !== "draft" && (
            <a href={`/dashboard/invoices/${invoice.id}/ubl`} download title={iv.ublHint} className={button}>
              {iv.ubl}
            </a>
          )}
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
          {invoice.status === "paid" && !closed && (
            <form action={setInvoiceStatus.bind(null, invoice.id, "sent")}>
              <button className={button}>{iv.notPaid}</button>
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

      {invoice.status === "sent" && !closed && send}

      {fixNumbers && (
        <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <summary className="cursor-pointer font-semibold">✏️ {iv.fix}</summary>
          <p className="mt-2 text-sm text-slate-700">{iv.fixText}</p>
          <ol className="mt-2 space-y-2 text-sm">
            <li className="rounded-xl border border-slate-200 p-3">1. {fill(iv.fixCredit, { number: fixNumbers[0]!, sum: euro(-invoiceTotals(invoice.lines, invoice.vat_mode).incl) })}</li>
            <li className="rounded-xl border border-slate-200 p-3">2. {fill(iv.fixCopy, { number: fixNumbers[1]! })}</li>
          </ol>
          <p className="mt-2 text-xs text-slate-500">{iv.fixNote}</p>
          <form action={correctInvoice.bind(null, invoice.id)} className="mt-3">
            <SubmitButton className="w-full rounded-lg bg-orange-600 px-4 py-3 font-bold text-white disabled:opacity-60">{iv.fixGo}</SubmitButton>
          </form>
        </details>
      )}

      {!invoice.credit_for && (reviewRow || invoice.status !== "draft") && (
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

      {/* A sent invoice is not edited: it is corrected with a credit note («Исправить счёт»). */}
      {invoice.status === "draft" && (
        <section className={card}>
          <InvoiceEditor t={t} invoice={invoice} />
        </section>
      )}
      {invoice.status === "draft" && send}
    </main>
  );
}
