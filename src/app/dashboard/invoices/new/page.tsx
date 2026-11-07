import Link from "next/link";
import { createInvoice } from "@/app/invoices-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { loadWorkspace } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

// A new invoice for an order (lines and receipts filled in) or without one.
export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const { supabase, user, profile, t } = await loadWorkspace();
  const { data: orderRows } = await supabase.from("orders").select("id, title").eq("user_id", user.id).order("created_at", { ascending: false });
  const orders = orderRows ?? [];
  const defaultOrderId = (order && orders.some((o) => o.id === order) ? order : null) ?? profile.current_order_id ?? "";
  const field = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3";

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <Link href="/dashboard/invoices" className="text-sm text-slate-600 underline">
        ← {t.invoicesTitle}
      </Link>
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
    </main>
  );
}
