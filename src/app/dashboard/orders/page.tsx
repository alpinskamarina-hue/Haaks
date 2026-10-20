import Link from "next/link";
import { createOrder, setCurrentOrder } from "@/app/orders-actions";
import { ReceiptCard } from "@/components/ReceiptCard";
import { SubmitButton } from "@/components/SubmitButton";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { claudeEnabled } from "@/lib/env";
import { euro, inQuarter, quarterOf, totals, type Order, type Receipt } from "@/lib/orders";
import { loadWorkspace, signedUrls } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const input = "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-base";

export default async function OrdersPage() {
  const { supabase, user, profile, t } = await loadWorkspace();

  const [{ data: orderRows }, { data: receiptRows }] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<Order[]>(),
    supabase
      .from("receipts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1000)
      .returns<Receipt[]>(),
  ]);
  const orders = orderRows ?? [];
  const receipts = receiptRows ?? [];
  const openOrders = orders.filter((o) => o.status === "open");
  const closedOrders = orders.filter((o) => o.status === "closed");
  const unsorted = receipts.filter((r) => !r.order_id);
  const quarter = quarterOf(new Date());
  const quarterTotals = totals(receipts.filter((r) => inQuarter(r, quarter)));
  const urls = await signedUrls(supabase, unsorted.map((r) => r.file_path));
  const currentId = openOrders.some((o) => o.id === profile.current_order_id)
    ? profile.current_order_id
    : null;

  const orderRow = (order: Order) => {
    const sum = totals(receipts.filter((r) => r.order_id === order.id));
    return (
      <li key={order.id} className="flex items-center justify-between gap-3 py-3">
        <Link href={`/dashboard/orders/${order.id}`} className="min-w-0 flex-1">
          <p className="truncate font-semibold">{order.title}</p>
          <p className="truncate text-sm text-slate-600">
            {[order.client_name, order.address].filter(Boolean).join(" · ") || "—"}
          </p>
          <p className="text-sm">
            {t.materials}: <b>{euro(sum.incl)}</b> · {t.receiptsCount}: {sum.count}
          </p>
        </Link>
        {order.status === "open" &&
          (order.id === currentId ? (
            <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              {t.isCurrent}
            </span>
          ) : (
            <form action={setCurrentOrder.bind(null, order.id)}>
              <button className="shrink-0 rounded-lg border border-slate-300 px-2 py-1 text-xs">
                {t.makeCurrent}
              </button>
            </form>
          ))}
      </li>
    );
  };

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">

      <section className={card}>
        <h2 className="mb-3 text-xl font-semibold">{t.addReceipts}</h2>
        {!currentId && <p className="mb-3 text-sm text-slate-600">{t.noCurrentOrder}</p>}
        <ReceiptUpload
          aiEnabled={claudeEnabled()}
          t={t}
          userId={user.id}
          orders={openOrders.map((o) => ({ id: o.id, title: o.title }))}
          defaultOrderId={currentId}
        />
      </section>

      <section className={card}>
        <p className="text-sm text-slate-600">{t.vatQuarter.replace("{q}", quarter.label)}</p>
        <p className="text-3xl font-bold">{euro(quarterTotals.vat)}</p>
        <p className="mt-1 text-sm text-slate-600">
          {t.materials}: {euro(quarterTotals.incl)} · {t.receiptsCount}: {quarterTotals.count}
        </p>
        <p className="mt-2 text-xs text-slate-500">{t.vatQuarterHint}</p>
      </section>

      <section className={card}>
        <h2 className="text-xl font-semibold">{t.ordersTitle}</h2>
        <ul className="divide-y divide-slate-100">{openOrders.map(orderRow)}</ul>
        <details className="mt-3" open={orders.length === 0}>
          <summary className="cursor-pointer font-medium text-orange-700">+ {t.newOrder}</summary>
          <form action={createOrder} className="mt-3 space-y-3">
            <label className="block text-sm font-medium">
              {t.orderTitle}
              <input name="title" required className={input} />
            </label>
            <label className="block text-sm font-medium">
              {t.clientName}
              <input name="client_name" className={input} />
            </label>
            <label className="block text-sm font-medium">
              {t.address}
              <input name="address" className={input} />
            </label>
            <SubmitButton className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-60">
              {t.createOrder}
            </SubmitButton>
          </form>
        </details>
        {closedOrders.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-slate-600">
              {t.closedOrders}: {closedOrders.length}
            </summary>
            <ul className="divide-y divide-slate-100">{closedOrders.map(orderRow)}</ul>
          </details>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-4 text-xl font-semibold">
          {t.unsorted} ({unsorted.length})
        </h2>
        {unsorted.length === 0 && <p className="text-slate-600">{t.noReceipts}</p>}
        <ul className="space-y-3">
          {unsorted.map((r) => (
            <ReceiptCard key={r.id} receipt={r} orders={openOrders} fileUrl={urls.get(r.file_path)} t={t} />
          ))}
        </ul>
      </section>
    </main>
  );
}
