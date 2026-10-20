import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteInvoice, setInvoiceStatus } from "@/app/invoices-actions";
import { CopyButton } from "@/components/CopyButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { InvoiceEditor } from "@/components/InvoiceEditor";
import { InvoiceStatusBadge } from "@/components/InvoiceStatusBadge";
import type { Invoice } from "@/lib/invoices";
import { siteUrl } from "@/lib/lang";
import { loadWorkspace } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile, t } = await loadWorkspace();

  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle<Invoice>();
  if (!invoice) notFound();

  const { data: order } = invoice.order_id
    ? await supabase.from("orders").select("id, title").eq("id", invoice.order_id).maybeSingle()
    : { data: null };
  const link = `${await siteUrl()}/f/${invoice.public_token}`;
  const button = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

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
              <button className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white">
                {t.markSent}
              </button>
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

      <section className={card}>
        {invoice.status !== "draft" && <p className="mb-3 text-sm text-amber-700">{t.editSentInvoice}</p>}
        <InvoiceEditor t={t} invoice={invoice} />
      </section>
    </main>
  );
}
