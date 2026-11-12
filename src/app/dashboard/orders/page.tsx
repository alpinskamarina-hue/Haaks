import Link from "next/link";
import { createOrder } from "@/app/orders-actions";
import { NextStepLink, StageBars } from "@/components/ProjectBits";
import { ReceiptCard } from "@/components/ReceiptCard";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { SubmitButton } from "@/components/SubmitButton";
import { claudeEnabled } from "@/lib/env";
import { euro, type Order } from "@/lib/orders";
import { summarize, type Group } from "@/lib/project";
import { getProjectDict } from "@/lib/project-i18n";
import { loadProjectParts } from "@/lib/project-server";
import { loadWorkspace, signedUrls } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const input = "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-base";
const LOCALES = { pl: "pl-PL", ro: "ro-RO", uk: "uk-UA", ru: "ru-RU", tr: "tr-TR", en: "en-GB", nl: "nl-NL" } as const;
const TABS: Group[] = ["work", "pay", "done"];
const BADGE: Record<string, string> = {
  quote: "bg-slate-100 text-slate-700",
  agreed: "bg-sky-100 text-sky-800",
  work: "bg-blue-100 text-blue-800",
  done: "bg-amber-100 text-amber-900",
  paid: "bg-green-100 text-green-800",
};

// Orders as projects: each card shows the stage, the money and what to do next.
export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ tab?: string; receipt?: string; new?: string }> }) {
  const sp = await searchParams;
  const { supabase, user, profile, lang, t } = await loadWorkspace();
  const p = getProjectDict(lang);
  const fmtDate = (d: string) =>
    new Intl.DateTimeFormat(LOCALES[lang], { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d.slice(0, 10)}T00:00:00Z`));

  const [{ data: orderRows }, parts] = await Promise.all([
    supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).returns<Order[]>(),
    loadProjectParts(supabase, user.id),
  ]);
  const orders = orderRows ?? [];
  const projects = orders.map((order) => ({
    order,
    s: summarize({
      order,
      quotes: parts.quotes.get(order.id) ?? [],
      invoices: parts.invoices.get(order.id) ?? [],
      receipts: parts.receipts.get(order.id) ?? [],
      trips: parts.trips.get(order.id) ?? [],
      hasReview: parts.reviewed.has(order.id),
      hasWork: parts.worked.has(order.id),
    }),
  }));
  const count = (g: Group) => projects.filter((x) => x.s.group === g).length;
  const tab: Group = TABS.includes(sp.tab as Group) ? (sp.tab as Group) : count("work") || !count("pay") ? "work" : "pay";
  const shown = projects.filter((x) => x.s.group === tab);

  const openOrders = orders.filter((o) => o.status === "open");
  const currentId = openOrders.some((o) => o.id === profile.current_order_id) ? profile.current_order_id : null;
  const unsorted = parts.allReceipts.filter((r) => !r.order_id);
  const urls = await signedUrls(supabase, unsorted.map((r) => r.file_path));
  const showReceipt = sp.receipt === "1";
  const showNew = sp.new === "1" || orders.length === 0;

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t.navOrders}</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href={showReceipt ? `?tab=${tab}` : `?tab=${tab}&receipt=1#receipt`}
            className={`rounded-lg border px-3 py-2 font-semibold ${showReceipt ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"}`}
          >
            📷 {p.receipt}
          </Link>
          <Link href={showNew ? `?tab=${tab}` : `?tab=${tab}&new=1#new`} className="rounded-lg bg-orange-600 px-3 py-2 font-semibold text-white">
            + {p.newOrder}
          </Link>
        </div>
      </div>

      {showReceipt && (
        <section id="receipt" className={card}>
          <h2 className="mb-3 text-lg font-semibold">{p.addReceipt}</h2>
          {!currentId && <p className="mb-3 text-sm text-slate-600">{t.noCurrentOrder}</p>}
          <ReceiptUpload
            aiEnabled={claudeEnabled()}
            t={t}
            userId={user.id}
            orders={openOrders.map((o) => ({ id: o.id, title: o.title }))}
            defaultOrderId={currentId}
          />
        </section>
      )}

      {showNew && (
        <section id="new" className={card}>
          <h2 className="mb-3 text-lg font-semibold">{p.newOrder}</h2>
          <form action={createOrder} className="space-y-3">
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
            <SubmitButton className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-60">{t.createOrder}</SubmitButton>
          </form>
        </section>
      )}

      <nav className="flex gap-2 overflow-x-auto pb-1 text-sm">
        {TABS.map((g) => (
          <Link
            key={g}
            href={`?tab=${g}`}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 font-semibold ${
              g === tab ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            {g === "work" ? p.tabWork : g === "pay" ? p.tabPay : p.tabDone} · {count(g)}
          </Link>
        ))}
      </nav>

      {shown.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-600">
          {tab === "work" ? p.emptyWork : tab === "pay" ? p.emptyPay : p.emptyDone}
        </p>
      )}
      <ul className="space-y-3">
        {shown.map(({ order, s }) => (
          <li key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Link href={`/dashboard/orders/${order.id}`} className="block">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold">{order.title}</p>
                  <p className="truncate text-sm text-slate-500">{[order.client_name, order.address].filter(Boolean).join(" · ") || "—"}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${BADGE[s.stage]}`}>{p.stage[s.stage]}</span>
              </div>
              <StageBars stage={s.stage} />
              <div className="flex flex-wrap justify-between gap-x-3 text-sm text-slate-600">
                {s.group === "pay" ? (
                  <span>
                    {p.toPay} <b className="text-slate-900">{euro(s.invoicedOpen)}</b>
                  </span>
                ) : s.price !== null ? (
                  <span>
                    {s.priceKind === "offered" ? p.offered : s.priceKind === "invoiced" ? p.invoiced : s.priceKind === "fixed" ? p.mFixed : p.price}{" "}
                    <b className="text-slate-900">{euro(s.price)}</b>
                  </span>
                ) : null}
                {s.materials + s.tripsCost > 0 && (
                  <span>
                    {p.expenses} <b className="text-slate-900">{euro(s.materials + s.tripsCost)}</b>
                  </span>
                )}
                {s.earned !== null && s.group !== "pay" && (
                  <span>
                    {p.yours} <b className="text-green-700">{euro(s.earned)}</b>
                  </span>
                )}
              </div>
            </Link>
            {s.next && <NextStepLink next={s.next} p={p} fmtDate={fmtDate} />}
          </li>
        ))}
      </ul>

      {unsorted.length > 0 && (
        <section className={card}>
          <h2 className="mb-4 text-lg font-semibold">
            {t.unsorted} ({unsorted.length})
          </h2>
          <ul className="space-y-3">
            {unsorted.map((r) => (
              <ReceiptCard key={r.id} receipt={r} orders={openOrders} fileUrl={urls.get(r.file_path)} t={t} />
            ))}
          </ul>
        </section>
      )}
      <p className="text-center text-xs text-slate-500">{p.vatMoved}</p>
    </main>
  );
}
