import Link from "next/link";
import { getAccountantDict } from "@/lib/accountant-i18n";
import { createInvoice } from "@/app/invoices-actions";
import { InvoiceStatusBadge } from "@/components/InvoiceStatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { invoiceTotals, type Invoice } from "@/lib/invoices";
import { euro, inQuarter, quarterOf, totals, type Receipt } from "@/lib/orders";
import { loadWorkspace } from "@/lib/workspace";
import { quoteTotals, type Quote } from "@/lib/quotes";
import { getQuotesListDict } from "@/lib/quotes-list-i18n";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const { supabase, user, profile, lang, t } = await loadWorkspace();

  const [{ data: orderRows }, { data: invoiceRows }, { data: receiptRows }, { data: acceptedRows }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("invoice_date", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<Invoice[]>(),
    supabase.from("receipts").select("*").eq("user_id", user.id).limit(2000).returns<Receipt[]>(),
    supabase
      .from("quotes")
      .select("id, number, title, client_name, lines, accepted_at")
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .order("accepted_at", { ascending: false })
      .returns<Pick<Quote, "id" | "number" | "title" | "client_name" | "lines" | "accepted_at">[]>(),
  ]);
  const l = getQuotesListDict(lang);
  const quarter = quarterOf(new Date());
  const quarterTotals = totals((receiptRows ?? []).filter((r) => inQuarter(r, quarter)));
  const orders = orderRows ?? [];
  const invoices = invoiceRows ?? [];
  const defaultOrderId = (order && orders.some((o) => o.id === order) ? order : null) ?? profile.current_order_id ?? "";
  const unpaid = invoices
    .filter((i) => i.status === "sent")
    .reduce((sum, i) => sum + invoiceTotals(i.lines, i.vat_mode).incl, 0);
  const withInvoice = new Set(invoices.map((i) => i.quote_id).filter(Boolean));
  const toInvoice = (acceptedRows ?? []).filter((x) => !withInvoice.has(x.id));
  const field = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3";

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      {toInvoice.length > 0 && (
        <section id="from-quotes" className="scroll-mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
          <h2 className="text-lg font-bold text-green-900">
            {l.fromQuotesTitle} · {toInvoice.length}
          </h2>
          <p className="mb-3 text-sm text-green-900">{l.fromQuotesHint}</p>
          <ul className="space-y-2">
            {toInvoice.map((x) => (
              <li key={x.id} className="rounded-xl bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/dashboard/quotes/${x.id}`} className="min-w-0">
                    <span className="block break-words font-semibold">{x.title}</span>
                    <span className="text-sm text-slate-500">
                      {x.number}
                      {x.client_name ? ` · ${x.client_name}` : ""}
                    </span>
                  </Link>
                  <span className="shrink-0 font-semibold">{euro(quoteTotals(x.lines).incl)}</span>
                </div>
                <form action={createInvoice} className="mt-2">
                  <input type="hidden" name="quote_id" value={x.id} />
                  <SubmitButton className="w-full rounded-lg bg-green-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">
                    🧾 {l.makeFromQuote}
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={card}>
        <h1 className="mb-3 text-2xl font-bold">{t.newInvoice}</h1>
        <p className="mb-3 text-sm text-slate-600">{t.invoiceHelp}</p>
        <form action={createInvoice} className="space-y-3">
          <label className="block text-sm font-medium">
            {t.quoteOrder}
            <select name="order_id" defaultValue={defaultOrderId} className={field}>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
              <option value="">{t.noOrder}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="with_receipts" />
            {t.addReceiptMaterials}
          </label>
          <SubmitButton className="w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60">
            + {t.newInvoice}
          </SubmitButton>
        </form>
      </section>

      <section className={card}>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold">{t.invoicesTitle}</h2>
          {unpaid > 0 && (
            <span className="text-sm text-slate-600">
              {t.unpaid}: <strong>{euro(unpaid)}</strong>
            </span>
          )}
        </div>
        {invoices.length === 0 && <p className="text-slate-600">{t.noInvoices}</p>}
        <ul className="divide-y divide-slate-100">
          {invoices.map((i) => (
            <li key={i.id}>
              <Link href={`/dashboard/invoices/${i.id}`} className="flex items-center justify-between gap-3 py-3">
                <span>
                  <span className="block font-medium">
                    {i.number} · {i.client_name ?? "—"}
                  </span>
                  <span className="text-sm text-slate-500">
                    {new Date(i.invoice_date).toLocaleDateString(lang)}
                    {i.vat_mode === "reverse" ? " · btw verlegd" : i.vat_mode === "kor" ? " · KOR" : ""}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-semibold">{euro(invoiceTotals(i.lines, i.vat_mode).incl)}</span>
                  <InvoiceStatusBadge status={i.status} t={t} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <Link href="/dashboard/accountant" className={`${card} flex items-center justify-between font-semibold`}>
        {getAccountantDict(lang).invoicesLink}
        <span className="text-orange-700">→</span>
      </Link>
      {quarterTotals.count > 0 && (
        <section className={card}>
          <p className="text-sm text-slate-600">{t.vatQuarter.replace("{q}", quarter.label)}</p>
          <p className="text-3xl font-bold">{euro(quarterTotals.vat)}</p>
          <p className="mt-1 text-sm text-slate-600">
            {t.materials}: {euro(quarterTotals.incl)} · {t.receiptsCount}: {quarterTotals.count}
          </p>
          <p className="mt-2 text-xs text-slate-500">{t.vatQuarterHint}</p>
        </section>
      )}
    </main>
  );
}
