import Link from "next/link";
import { notFound } from "next/navigation";
import { setCurrentOrder, setOrderStatus } from "@/app/orders-actions";
import { ReceiptCard } from "@/components/ReceiptCard";
import { InvoiceStatusBadge } from "@/components/InvoiceStatusBadge";
import { QuoteStatusBadge } from "@/components/QuoteStatusBadge";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { invoiceTotals, type Invoice } from "@/lib/invoices";
import { claudeEnabled } from "@/lib/env";
import { euro, type Order, type Receipt } from "@/lib/orders";
import { quoteTotals, type Quote } from "@/lib/quotes";
import { createMaterialList } from "@/app/materials-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { listTotal, STATUS_COLOR, type MaterialList } from "@/lib/materials";
import { getMaterialsDict } from "@/lib/materials-i18n";
import { loadWorkspace, signedUrls } from "@/lib/workspace";
import { getWorksDict } from "@/lib/works-i18n";
import { getReviewsDict } from "@/lib/reviews-i18n";
import { requestReview } from "@/app/reviews-actions";
import { NextStepLink, StageLine } from "@/components/ProjectBits";
import { projectEvents, summarize } from "@/lib/project";
import { fillP, getProjectDict } from "@/lib/project-i18n";
import { loadProjectParts } from "@/lib/project-server";

const LOCALES = { pl: "pl-PL", ro: "ro-RO", uk: "uk-UA", ru: "ru-RU", tr: "tr-TR", en: "en-GB", nl: "nl-NL" } as const;

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review?: string }>;
}) {
  const { id } = await params;
  const { review: reviewError } = await searchParams;
  const { supabase, user, profile, lang, t } = await loadWorkspace();
  const m = getMaterialsDict(lang);

  const [{ data: order }, { data: openRows }, { data: receiptRows }, { data: quoteRows }, { data: invoiceRows }] = await Promise.all([
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
    supabase
      .from("quotes")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: false })
      .returns<Quote[]>(),
    supabase
      .from("invoices")
      .select("*")
      .eq("order_id", id)
      .order("invoice_date", { ascending: false })
      .returns<Invoice[]>(),
  ]);
  if (!order) notFound();
  const wk = getWorksDict(lang);
  const { data: work } = await supabase.from("works").select("id").eq("order_id", id).limit(1).maybeSingle<{ id: string }>();
  const rv = getReviewsDict(lang);
  const { data: reviewRow } = await supabase.from("reviews").select("id, status").eq("order_id", id).limit(1).maybeSingle<{ id: string; status: string }>();
  const { data: materialRows } = await supabase
    .from("material_lists")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: false })
    .returns<MaterialList[]>();

  const receipts = receiptRows ?? [];
  const p = getProjectDict(lang);
  const parts = await loadProjectParts(supabase, user.id, order.id);
  const partsOf = {
    order,
    quotes: parts.quotes.get(order.id) ?? [],
    invoices: parts.invoices.get(order.id) ?? [],
    receipts,
    trips: parts.trips.get(order.id) ?? [],
  };
  const s = summarize({ ...partsOf, hasReview: Boolean(reviewRow), hasWork: Boolean(work) });
  const events = projectEvents({ ...partsOf, euro });
  const fmtDate = (d: string) =>
    new Intl.DateTimeFormat(LOCALES[lang], { day: "numeric", month: "short", timeZone: d.length > 10 ? "Europe/Amsterdam" : "UTC" }).format(
      new Date(d.length > 10 ? d : `${d}T00:00:00Z`),
    );
  const urls = await signedUrls(supabase, receipts.map((r) => r.file_path));
  const moveTargets = [...(openRows ?? [])];
  if (!moveTargets.some((o) => o.id === order.id)) moveTargets.unshift({ id: order.id, title: order.title });
  const isCurrent = profile.current_order_id === order.id;

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <Link href="/dashboard/orders" className="text-sm text-slate-600 underline">
        ← {t.back}
      </Link>

      <section className={card}>
        <h1 className="text-2xl font-bold">{order.title}</h1>
        <p className="text-slate-600">{[order.client_name, order.address].filter(Boolean).join(" · ") || "—"}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm font-semibold">
          {order.address ? (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}`}
              target="_blank"
              rel="noopener"
              className="flex flex-col items-center rounded-lg border border-slate-300 px-1 py-2"
            >
              <span className="text-lg">🧭</span>{p.route}
            </a>
          ) : (
            <span className="flex flex-col items-center rounded-lg border border-slate-200 px-1 py-2 text-slate-300"><span className="text-lg">🧭</span>{p.route}</span>
          )}
          <Link href={`/dashboard/quotes/new?order=${order.id}`} className="flex flex-col items-center rounded-lg border border-slate-300 px-1 py-2">
            <span className="text-lg">📝</span>{p.quote}
          </Link>
          <Link href={`/dashboard/invoices?order=${order.id}`} className="flex flex-col items-center rounded-lg border border-slate-300 px-1 py-2">
            <span className="text-lg">🧾</span>{p.invoice}
          </Link>
        </div>
        <StageLine stage={s.stage} p={p} />
      </section>

      <section className={card}>
        {s.price !== null ? (
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">{s.priceKind === "offered" ? p.mOffered : s.priceKind === "invoiced" ? p.mInvoiced : p.mPrice}</dt>
              <dd>{euro(s.price)}</dd>
            </div>
            {s.receiptCount > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-600">{fillP(p.mMaterials, { n: s.receiptCount })}</dt>
                <dd>− {euro(s.materials)}</dd>
              </div>
            )}
            {s.km > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-600">{fillP(p.mTrips, { km: s.km })}</dt>
                <dd>− {euro(s.tripsCost)}</dd>
              </div>
            )}
            {s.earned !== null && (
              <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-base font-bold">
                <dt>{p.mEarned}</dt>
                <dd className="text-green-700">{euro(s.earned)}</dd>
              </div>
            )}
            <p className="pt-1 text-xs text-slate-500">{p.mExVat}</p>
          </dl>
        ) : (
          <p className="text-sm text-slate-600">{p.mNoPrice}</p>
        )}
        {s.next && <NextStepLink next={s.next} p={p} fmtDate={fmtDate} big />}
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {order.status === "open" && !isCurrent && (
            <form action={setCurrentOrder.bind(null, order.id)}>
              <button className="rounded-lg border border-slate-300 px-3 py-1.5">{t.makeCurrent}</button>
            </form>
          )}
          {isCurrent && <span className="rounded-full bg-green-100 px-3 py-1.5 font-medium text-green-800">{t.currentOrder}</span>}
          <form action={setOrderStatus.bind(null, order.id, order.status === "open" ? "closed" : "open")}>
            <button className="rounded-lg border border-slate-300 px-3 py-1.5">{order.status === "open" ? p.close : p.reopen}</button>
          </form>
        </div>
      </section>

      <section className={card}>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{p.history}</h2>
        <ul className="space-y-1.5 text-sm">
          {events.slice(0, 6).map((e, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-14 shrink-0 text-slate-400">{fmtDate(e.at)}</span>
              <span>
                {e.icon}{" "}
                {e.href ? (
                  <Link href={e.href} className="underline decoration-slate-300">
                    {fillP(p.ev[e.key], e.vars)}
                  </Link>
                ) : (
                  fillP(p.ev[e.key], e.vars)
                )}
              </span>
            </li>
          ))}
        </ul>
        {events.length > 6 && (
          <details className="mt-1.5 text-sm">
            <summary className="cursor-pointer text-slate-500">{fillP(p.more, { n: events.length - 6 })}</summary>
            <ul className="mt-1.5 space-y-1.5">
              {events.slice(6).map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-14 shrink-0 text-slate-400">{fmtDate(e.at)}</span>
                  <span>
                    {e.icon} {fillP(p.ev[e.key], e.vars)}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {(reviewRow ||
        order.status === "closed" ||
        (invoiceRows ?? []).some((i) => i.status !== "draft") ||
        (quoteRows ?? []).some((q) => q.status === "accepted")) && (
        <section id="review" className="scroll-mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          {reviewRow ? (
            <Link href={`/dashboard/reviews/${reviewRow.id}`} className="font-semibold text-amber-900 underline">
              ⭐ {reviewRow.status === "requested" ? rv.open : rv.nav}
            </Link>
          ) : (
            <>
              <p className="text-sm text-amber-900">{rv.askHint}</p>
              <form action={requestReview} className="mt-2">
                <input type="hidden" name="order" value={order.id} />
                <button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white">{rv.ask}</button>
              </form>
            </>
          )}
        </section>
      )}
      {reviewError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{rv.notAllowed}</p>}

      {(order.status === "closed" || work) && (
        <section className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
          {work ? (
            <Link href={`/dashboard/works/${work.id}`} className="font-semibold text-orange-800 underline">
              🧱 {wk.openWork}
            </Link>
          ) : (
            <>
              <p className="text-sm text-orange-900">{wk.fromOrderHint}</p>
              <Link href={`/dashboard/works/new?order=${order.id}`} className="mt-2 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
                🧱 {wk.fromOrder}
              </Link>
            </>
          )}
        </section>
      )}

      <section className={card}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{t.quotesTitle}</h2>
          <Link
            href={`/dashboard/quotes?order=${order.id}`}
            className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white"
          >
            + {t.newQuote}
          </Link>
        </div>
        {(quoteRows ?? []).length === 0 && <p className="text-slate-600">{t.noQuotes}</p>}
        <ul className="divide-y divide-slate-100">
          {(quoteRows ?? []).map((q) => (
            <li key={q.id}>
              <Link href={`/dashboard/quotes/${q.id}`} className="flex items-center justify-between gap-3 py-2">
                <span>
                  <span className="block font-medium">{q.title}</span>
                  <span className="text-sm text-slate-500">{q.number}</span>
                </span>
                <span className="text-right">
                  <span className="block font-semibold">{euro(quoteTotals(q.lines).incl)}</span>
                  <QuoteStatusBadge status={q.status} t={t} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{m.listsTitle}</h2>
          <form action={createMaterialList}>
            <input type="hidden" name="order_id" value={order.id} />
            <SubmitButton className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
              + {m.newList}
            </SubmitButton>
          </form>
        </div>
        {(materialRows ?? []).length === 0 && <p className="text-slate-600">{m.listsHint}</p>}
        <ul className="divide-y divide-slate-100">
          {(materialRows ?? []).map((l) => (
            <li key={l.id}>
              <Link href={`/dashboard/materials/${l.id}`} className="flex items-center justify-between gap-3 py-2">
                <span>
                  <span className="block font-medium">{l.title}</span>
                  <span className="text-sm text-slate-500">{m.items.replace("{n}", String(l.items.length))}</span>
                </span>
                <span className="text-right">
                  <span className="block font-semibold">{euro(listTotal(l.items))}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[l.status]}`}>
                    {m.status[l.status]}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{t.invoicesTitle}</h2>
          <Link
            href={`/dashboard/invoices?order=${order.id}`}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            + {t.newInvoice}
          </Link>
        </div>
        {(invoiceRows ?? []).length === 0 && <p className="text-slate-600">{t.noInvoices}</p>}
        <ul className="divide-y divide-slate-100">
          {(invoiceRows ?? []).map((inv) => (
            <li key={inv.id}>
              <Link href={`/dashboard/invoices/${inv.id}`} className="flex items-center justify-between gap-3 py-2">
                <span className="font-medium">{inv.number}</span>
                <span className="text-right">
                  <span className="block font-semibold">{euro(invoiceTotals(inv.lines, inv.vat_mode).incl)}</span>
                  <InvoiceStatusBadge status={inv.status} t={t} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {order.status === "open" && (
        <section id="receipt" className={`${card} scroll-mt-4`}>
          <h2 className="mb-3 text-xl font-semibold">{t.addReceipts}</h2>
          <ReceiptUpload
            aiEnabled={claudeEnabled()}
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
