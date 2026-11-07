import Link from "next/link";
import { redirect } from "next/navigation";
import { createInvoice, setInvoiceStatus } from "@/app/invoices-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { getAccountantDict } from "@/lib/accountant-i18n";
import { invoiceTotals, type Invoice } from "@/lib/invoices";
import { getInvoicesDict } from "@/lib/invoices-i18n";
import { euro } from "@/lib/orders";
import { fill } from "@/lib/quotes-i18n";
import { quoteTotals, type Quote } from "@/lib/quotes";
import { getQuotesListDict } from "@/lib/quotes-list-i18n";
import { loadWorkspace } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
const TABS = ["draft", "open", "paid"] as const;
type Tab = (typeof TABS)[number];

// Invoices: money we wait for on top, then tabs. Overdue invoices are red and can be reminded right here.
export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ order?: string; tab?: string }> }) {
  const { order, tab: tabParam } = await searchParams;
  // Old links «Счёт» from an order: the new-invoice form lives on its own page now.
  if (order) redirect(`/dashboard/invoices/new?order=${encodeURIComponent(order)}`);
  const { supabase, user, lang } = await loadWorkspace();
  const iv = getInvoicesDict(lang);
  const l = getQuotesListDict(lang);

  const [{ data: invoiceRows }, { data: acceptedRows }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("invoice_date", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<Invoice[]>(),
    supabase
      .from("quotes")
      .select("id, number, title, client_name, lines, accepted_at")
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .order("accepted_at", { ascending: false })
      .returns<Pick<Quote, "id" | "number" | "title" | "client_name" | "lines" | "accepted_at">[]>(),
  ]);
  const invoices = invoiceRows ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const sum = (i: Invoice) => invoiceTotals(i.lines, i.vat_mode).incl;
  const days = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 864e5);
  const fmt = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString(lang, { day: "numeric", month: "short" });

  const groups: Record<Tab, Invoice[]> = {
    draft: invoices.filter((i) => i.status === "draft"),
    // Overdue first, the longest overdue on top; then by due date.
    open: invoices
      .filter((i) => i.status === "sent")
      .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999")),
    paid: invoices.filter((i) => i.status === "paid").sort((a, b) => (b.paid_at ?? b.updated_at).localeCompare(a.paid_at ?? a.updated_at)),
  };
  const isOverdue = (i: Invoice) => i.status === "sent" && !!i.due_date && i.due_date < today;
  const waiting = groups.open.reduce((s, i) => s + sum(i), 0);
  const overdue = groups.open.filter(isOverdue).reduce((s, i) => s + sum(i), 0);
  const paidMonth = groups.paid.filter((i) => (i.paid_at ?? "").startsWith(month)).reduce((s, i) => s + sum(i), 0);
  const tab: Tab = (TABS as readonly string[]).includes(tabParam ?? "")
    ? (tabParam as Tab)
    : groups.open.length
      ? "open"
      : groups.draft.length
        ? "draft"
        : "paid";
  const list = groups[tab];
  const tabLabel = { draft: iv.tabDraft, open: iv.tabOpen, paid: iv.tabPaid };
  const empty = { draft: iv.emptyDraft, open: iv.emptyOpen, paid: iv.emptyPaid };

  const numberOf = new Map(invoices.map((i) => [i.id, i.number]));
  const withInvoice = new Set(invoices.map((i) => i.quote_id).filter(Boolean));
  const toInvoice = (acceptedRows ?? []).filter((x) => !withInvoice.has(x.id));
  const tag = "inline-block rounded-full px-2 py-0.5 text-xs font-semibold";

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{iv.title}</h1>
        <Link href="/dashboard/invoices/new" className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white">
          {iv.add}
        </Link>
      </div>

      <section className={`${card} grid grid-cols-3 gap-2 text-center`}>
        <div>
          <b className="block">{euro(waiting)}</b>
          <span className="text-xs text-slate-500">{iv.sumWaiting}</span>
        </div>
        <div>
          <b className={`block ${overdue > 0 ? "text-red-700" : ""}`}>{euro(overdue)}</b>
          <span className="text-xs text-slate-500">{iv.sumOverdue}</span>
        </div>
        <div>
          <b className="block text-green-700">{euro(paidMonth)}</b>
          <span className="text-xs text-slate-500">{iv.sumPaid}</span>
        </div>
      </section>

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

      <nav className="grid grid-cols-3 gap-2">
        {TABS.map((k) => (
          <Link
            key={k}
            href={`/dashboard/invoices?tab=${k}`}
            className={`rounded-xl border px-1 py-2 text-center text-sm font-bold ${k === tab ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"}`}
          >
            {tabLabel[k]}
            {k !== "paid" && groups[k].length > 0 ? ` · ${groups[k].length}` : ""}
          </Link>
        ))}
      </nav>

      {list.length === 0 && <p className="py-6 text-center text-slate-600">{empty[tab]}</p>}
      <ul className="space-y-2">
        {list.map((i) => {
          const late = isOverdue(i);
          const left = i.due_date ? days(today, i.due_date) : null;
          return (
            <li key={i.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${late ? "border-red-300" : "border-slate-200"}`}>
              <Link href={`/dashboard/invoices/${i.id}`} className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block break-words">
                    <b>{i.number}</b> · {i.client_name ?? "—"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {fill(iv.issued, { date: fmt(i.invoice_date) })}
                    {i.due_date && i.status !== "paid" ? ` · ${fill(iv.due, { date: fmt(i.due_date) })}` : ""}
                    {i.vat_mode === "reverse" ? " · btw verlegd" : i.vat_mode === "kor" ? " · KOR" : ""}
                  </span>
                </span>
                <b className="shrink-0 whitespace-nowrap">{euro(sum(i))}</b>
              </Link>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {i.status === "draft" && <span className={`${tag} bg-slate-100 text-slate-600`}>{iv.draftHint}</span>}
                {i.credit_for && <span className={`${tag} bg-slate-100 text-slate-600`}>{fill(iv.creditTag, { number: numberOf.get(i.credit_for) ?? "—" })}</span>}
                {i.credited_by && <span className={`${tag} bg-slate-100 text-slate-600`}>{fill(iv.cancelledTag, { number: numberOf.get(i.credited_by) ?? "—" })}</span>}
                {i.status === "paid" && i.paid_at && !i.credit_for && !i.credited_by && <span className={`${tag} bg-green-100 text-green-800`}>{fill(iv.paidOn, { date: fmt(i.paid_at) })}</span>}
                {i.status === "sent" && left !== null && (
                  <span className={`${tag} ${late ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}>
                    {late ? fill(iv.overdue, { n: -left }) : left === 0 ? iv.dueToday : fill(iv.dueIn, { n: left })}
                  </span>
                )}
                {i.status === "sent" &&
                  (i.viewed_at ? (
                    <span className={`${tag} bg-green-100 text-green-800`}>{fill(iv.opened, { date: fmt(i.viewed_at) })}</span>
                  ) : (
                    <span className={`${tag} bg-slate-100 text-slate-600`}>{iv.notOpened}</span>
                  ))}
                {i.status === "sent" && i.reminder_count > 0 && i.reminded_at && (
                  <span className={`${tag} bg-slate-100 text-slate-600`}>{fill(iv.reminded, { n: i.reminder_count, date: fmt(i.reminded_at) })}</span>
                )}
              </div>
              {i.status === "draft" && (
                <Link href={`/dashboard/invoices/${i.id}#send`} className="mt-2 block rounded-lg border border-orange-600 py-2 text-center text-sm font-bold text-orange-700">
                  {iv.finish}
                </Link>
              )}
              {i.status === "sent" &&
                (late ? (
                  <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                    <Link href={`/dashboard/invoices/${i.id}#send`} className="rounded-lg bg-orange-600 py-2 text-center text-sm font-bold text-white">
                      {i.reminder_count >= 1 ? iv.remind2 : iv.remind1}
                    </Link>
                    <form action={setInvoiceStatus.bind(null, i.id, "paid")}>
                      <SubmitButton className="h-full rounded-lg border border-green-700 px-3 text-sm font-bold text-green-800 disabled:opacity-60">{iv.markPaid}</SubmitButton>
                    </form>
                  </div>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <form action={setInvoiceStatus.bind(null, i.id, "paid")}>
                      <SubmitButton className="w-full rounded-lg border border-green-700 py-2 text-sm font-bold text-green-800 disabled:opacity-60">{iv.markPaid}</SubmitButton>
                    </form>
                    <Link href={`/dashboard/invoices/${i.id}#send`} className="rounded-lg border border-slate-300 py-2 text-center text-sm font-semibold text-slate-700">
                      {i.reminder_count >= 1 ? iv.remind2 : iv.remind1}
                    </Link>
                  </div>
                ))}
            </li>
          );
        })}
      </ul>

      <Link href="/dashboard/accountant" className={`${card} flex items-center justify-between font-semibold`}>
        {getAccountantDict(lang).invoicesLink}
        <span className="text-orange-700">→</span>
      </Link>
    </main>
  );
}
