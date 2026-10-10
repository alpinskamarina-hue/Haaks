import Link from "next/link";
import { notFound } from "next/navigation";
import { setCurrentOrder, setOrderStatus } from "@/app/orders-actions";
import { AppHeader } from "@/components/AppHeader";
import { ReceiptCard } from "@/components/ReceiptCard";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { euro, totals, type Order, type Receipt } from "@/lib/orders";
import { loadWorkspace, signedUrls } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile, lang, t } = await loadWorkspace();

  const [{ data: order }, { data: openRows }, { data: receiptRows }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle<Order>(),
    supabase
      .from("orders")
      .select("id, title")
      .eq("user_id", user.id)
      .eq("status", "open")
      .order("created_at", { ascending: false }),
    supabase
      .from("receipts")
      .select("*")
      .eq("order_id", id)
      .order("purchased_on", { ascending: false, nullsFirst: true })
      .returns<Receipt[]>(),
  ]);
  if (!order) notFound();

  const receipts = receiptRows ?? [];
  const sum = totals(receipts);
  const urls = await signedUrls(supabase, receipts.map((r) => r.file_path));
  const moveTargets = [...(openRows ?? [])];
  if (!moveTargets.some((o) => o.id === order.id)) moveTargets.unshift({ id: order.id, title: order.title });
  const isCurrent = profile.current_order_id === order.id;

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <AppHeader lang={lang} t={t} active="orders" />
      <Link href="/dashboard/orders" className="text-sm text-slate-600 underline">
        ← {t.back}
      </Link>

      <section className={card}>
        <h1 className="text-2xl font-bold">{order.title}</h1>
        <p className="text-slate-600">
          {[order.client_name, order.address].filter(Boolean).join(" · ") || "—"}
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 p-2">
            <dt className="text-xs text-slate-500">{t.total}</dt>
            <dd className="font-bold">{euro(sum.incl)}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <dt className="text-xs text-slate-500">{t.exclVat}</dt>
            <dd className="font-bold">{euro(sum.excl)}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <dt className="text-xs text-slate-500">{t.vat}</dt>
            <dd className="font-bold">{euro(sum.vat)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {order.status === "open" && !isCurrent && (
            <form action={setCurrentOrder.bind(null, order.id)}>
              <button className="rounded-lg border border-slate-300 px-3 py-2">{t.makeCurrent}</button>
            </form>
          )}
          {isCurrent && (
            <span className="rounded-full bg-green-100 px-3 py-2 font-medium text-green-800">{t.currentOrder}</span>
          )}
          <form action={setOrderStatus.bind(null, order.id, order.status === "open" ? "closed" : "open")}>
            <button className="rounded-lg border border-slate-300 px-3 py-2">
              {order.status === "open" ? t.closeOrder : t.reopenOrder}
            </button>
          </form>
        </div>
      </section>

      {order.status === "open" && (
        <section className={card}>
          <h2 className="mb-3 text-xl font-semibold">{t.addReceipts}</h2>
          <ReceiptUpload
            t={t}
            userId={user.id}
            orders={[{ id: order.id, title: order.title }]}
            defaultOrderId={order.id}
            fixedOrder
          />
        </section>
      )}

      <section className={card}>
        <h2 className="mb-4 text-xl font-semibold">
          {t.receiptsCount} ({receipts.length})
        </h2>
        {receipts.length === 0 && <p className="text-slate-600">{t.noReceipts}</p>}
        <ul className="space-y-3">
          {receipts.map((r) => (
            <ReceiptCard key={r.id} receipt={r} orders={moveTargets} fileUrl={urls.get(r.file_path)} t={t} />
          ))}
        </ul>
      </section>
    </main>
  );
}
