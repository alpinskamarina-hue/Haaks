import Link from "next/link";
import { redirect } from "next/navigation";
import { extendQuote } from "@/app/quotes-actions";
import { euro } from "@/lib/orders";
import { dutchToday, quoteTotals, type Quote } from "@/lib/quotes";
import { daysSince, fill, getQuotesDict, whenText } from "@/lib/quotes-i18n";
import { getQuotesListDict, LOW_QUOTE_TOTAL } from "@/lib/quotes-list-i18n";
import { loadWorkspace } from "@/lib/workspace";

const LOCALES = { pl: "pl-PL", ro: "ro-RO", uk: "uk-UA", ru: "ru-RU", tr: "tr-TR", en: "en-GB", nl: "nl-NL" } as const;
type Row = Quote & { sent_at: string | null; viewed_at: string | null };
type Group = "action" | "waiting" | "accepted" | "lost";
const GROUPS: Group[] = ["action", "waiting", "accepted", "lost"];
const REMIND_AFTER = 3;

// The worker's quotes sorted by what to do next: one button per card, invoices stay in «Счета».
export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  // Old links from an order ("make a quote for this order") open the new-quote form.
  if (order) redirect(`/dashboard/quotes/new?order=${encodeURIComponent(order)}`);
  const { supabase, user, lang, t } = await loadWorkspace();
  const q = getQuotesDict(lang);
  const l = getQuotesListDict(lang);
  const today = dutchToday();

  const [{ data: quoteRows }, { data: invoiceRows }, { data: orderRows }] = await Promise.all([
    supabase.from("quotes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).returns<Row[]>(),
    supabase.from("invoices").select("quote_id").eq("user_id", user.id).not("quote_id", "is", null),
    supabase.from("orders").select("id, title").eq("user_id", user.id),
  ]);
  const quotes = quoteRows ?? [];
  const invoiced = new Set((invoiceRows ?? []).map((i) => i.quote_id as string));
  const orderTitle = new Map((orderRows ?? []).map((o) => [o.id as string, o.title as string]));
  const fmt = (d: string) =>
    new Intl.DateTimeFormat(LOCALES[lang], { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d.slice(0, 10)}T00:00:00Z`));

  const expired = (x: Row) => x.status === "sent" && !!x.valid_until && x.valid_until < today;
  const lastTouch = (x: Row) => [x.sent_at ?? x.updated_at, x.viewed_at ?? ""].sort().at(-1)!;
  const groupOf = (x: Row): Group => {
    if (x.status === "draft") return "action";
    if (x.status === "accepted") return invoiced.has(x.id) ? "accepted" : "action";
    if (x.status === "declined" || expired(x)) return "lost";
    return daysSince(lastTouch(x)) >= REMIND_AFTER ? "action" : "waiting";
  };
  const items = quotes.map((x) => ({ x, g: groupOf(x), total: quoteTotals(x.lines).incl }));

  // Summary: money waiting for an answer, money accepted this month, and how many get accepted.
  const month = today.slice(0, 7);
  const waitingSum = items.filter(({ x }) => x.status === "sent" && !expired(x)).reduce((s, i) => s + i.total, 0);
  const acceptedSum = items.filter(({ x }) => x.status === "accepted" && (x.accepted_at ?? "").slice(0, 7) === month).reduce((s, i) => s + i.total, 0);
  const decided = items.filter(({ x }) => x.status === "accepted" || x.status === "declined" || expired(x));
  const won = decided.filter(({ x }) => x.status === "accepted").length;
  const groupTitle: Record<Group, string> = { action: l.gAction, waiting: l.gWaiting, accepted: l.gAccepted, lost: l.gLost };

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold">{t.navQuotes}</h1>
      <Link href="/dashboard/quotes/new" className="block rounded-2xl bg-orange-600 px-4 py-3.5 text-center text-lg font-bold text-white shadow-sm">
        + {t.newQuote}
      </Link>

      {quotes.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">{t.noQuotes}</p>}

      {quotes.length > 0 && (
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center">
          <div>
            <b className="block text-base">{euro(waitingSum)}</b>
            <span className="text-xs text-slate-500">{l.sumWaiting}</span>
          </div>
          <div>
            <b className="block text-base text-green-700">{euro(acceptedSum)}</b>
            <span className="text-xs text-slate-500">{l.sumAccepted}</span>
          </div>
          <div>
            <b className="block text-base">{decided.length ? fill(l.ofN, { a: won, n: decided.length }) : "—"}</b>
            <span className="text-xs text-slate-500">{l.sumRate}</span>
          </div>
        </div>
      )}

      {GROUPS.map((g) => {
        const list = items.filter((i) => i.g === g);
        if (!list.length) return null;
        return (
          <section key={g}>
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
              {groupTitle[g]} · {list.length}
            </h2>
            <ul className="space-y-2">
              {list.map(({ x, total }) => {
                const href = `/dashboard/quotes/${x.id}`;
                const isExpired = expired(x);
                const silentDays = x.status === "sent" ? daysSince(lastTouch(x)) : 0;
                const low = x.status === "draft" && total < LOW_QUOTE_TOTAL;
                return (
                  <li key={x.id} className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${g === "lost" ? "opacity-70" : ""}`}>
                    <Link href={href} className="block">
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0 break-words font-semibold">{x.title}</span>
                        <span className="shrink-0 font-semibold">{euro(total)}</span>
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-500">
                        {x.number}
                        {" · "}
                        {x.client_name ? x.client_name : <span className="text-orange-700">{l.noClient}</span>}
                        {x.order_id && orderTitle.get(x.order_id) ? ` · 📁 ${orderTitle.get(x.order_id)}` : ""}
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-slate-700">
                        {x.status === "draft" && (
                          <span>
                            {l.draft}
                            {low && <span className="text-orange-700"> · {l.checkPrice}</span>}
                          </span>
                        )}
                        {x.status === "sent" && !isExpired && (
                          <span>
                            {x.viewed_at ? fill(q.viewed, { when: whenText(x.viewed_at, lang) }) : fill(q.sentAgo, { when: whenText(x.sent_at ?? x.updated_at, lang) })}
                          </span>
                        )}
                        {x.status === "sent" && !isExpired && x.valid_until && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{fill(l.validTo, { date: fmt(x.valid_until) })}</span>
                        )}
                        {x.status === "accepted" && invoiced.has(x.id) && <span className="text-green-800">{l.invoiceDone}</span>}
                        {x.status === "declined" && <span>{l.declined}</span>}
                        {isExpired && <span>{fill(l.expired, { date: fmt(x.valid_until!) })}</span>}
                      </span>
                    </Link>

                    {x.status === "draft" && (
                      <Link href={href} className="mt-3 block rounded-xl bg-orange-600 py-2.5 text-center text-sm font-bold text-white">
                        {l.actSend}
                      </Link>
                    )}
                    {g === "action" && x.status === "sent" && (
                      <Link href={`${href}#remind`} className="mt-3 block rounded-xl border border-orange-600 py-2.5 text-center text-sm font-bold text-orange-700">
                        {l.actRemind} · {fill(l.silent, { n: silentDays })}
                      </Link>
                    )}
                    {x.status === "accepted" && !invoiced.has(x.id) && (
                      <Link href="/dashboard/invoices#from-quotes" className="mt-2 block text-sm font-semibold text-green-800 underline decoration-green-300">
                        {l.acceptedNoInvoice}
                      </Link>
                    )}
                    {isExpired && (
                      <form action={extendQuote.bind(null, x.id)} className="mt-2">
                        <button className="text-sm font-semibold text-slate-700 underline">{l.extend}</button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
