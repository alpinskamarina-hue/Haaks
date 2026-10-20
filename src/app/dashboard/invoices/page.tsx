import Link from "next/link";
import { createInvoice } from "@/app/invoices-actions";
import { InvoiceStatusBadge } from "@/components/InvoiceStatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { invoiceTotals, type Invoice } from "@/lib/invoices";
import { euro } from "@/lib/orders";
import { loadWorkspace } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const { supabase, user, profile, lang, t } = await loadWorkspace();

  const [{ data: orderRows }, { data: invoiceRows }] = await Promise.all([
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
  ]);
  const orders = orderRows ?? [];
  const invoices = invoiceRows ?? [];
  const defaultOrderId = (order && orders.some((o) => o.id === order) ? order : null) ?? profile.current_order_id ?? "";
  const unpaid = invoices
    .filter((i) => i.status === "sent")
    .reduce((sum, i) => sum + invoiceTotals(i.lines, i.vat_mode).incl, 0);
  const field = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3";

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">

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
    </main>
  );
}
