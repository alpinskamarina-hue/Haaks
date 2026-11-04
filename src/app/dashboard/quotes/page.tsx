import Link from "next/link";
import { redirect } from "next/navigation";
import { euro } from "@/lib/orders";
import { quoteTotals, type Quote } from "@/lib/quotes";
import { fill, getQuotesDict, whenText } from "@/lib/quotes-i18n";
import { loadWorkspace } from "@/lib/workspace";

const TABS = ["all", "draft", "sent", "accepted"] as const;
type Tab = (typeof TABS)[number];

// The worker's quotes first, with tabs and a status line; a new quote is one big button away.
export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ order?: string; tab?: string }> }) {
  const { order, tab: tabParam } = await searchParams;
  // Old links from an order ("make a quote for this order") open the new-quote form.
  if (order) redirect(`/dashboard/quotes/new?order=${encodeURIComponent(order)}`);
  const { supabase, user, lang, t } = await loadWorkspace();
  const q = getQuotesDict(lang);
  const tab: Tab = (TABS as readonly string[]).includes(tabParam ?? "") ? (tabParam as Tab) : "all";

  const [{ data: quoteRows }, { data: invoiceRows }] = await Promise.all([
    supabase
      .from("quotes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<(Quote & { sent_at: string | null; viewed_at: string | null })[]>(),
    supabase.from("invoices").select("quote_id").eq("user_id", user.id).not("quote_id", "is", null),
  ]);
  const quotes = quoteRows ?? [];
  const invoiced = new Set((invoiceRows ?? []).map((i) => i.quote_id as string));
  const inTab = (s: Quote["status"], tb: Tab) => tb === "all" || s === tb || (tb === "sent" && s === "declined");
  const count = (tb: Tab) => quotes.filter((x) => inTab(x.status, tb)).length;
  const shown = quotes.filter((x) => inTab(x.status, tab));
  const tabLabel = { all: q.tabAll, draft: q.tabDraft, sent: q.tabSent, accepted: q.tabAccepted };

  const status = (x: (typeof quotes)[number]) => {
    if (x.status === "accepted")
      return { text: invoiced.has(x.id) ? q.invoiced : `✓ ${t.statusAccepted}`, cls: "bg-green-100 text-green-800" };
    if (x.status === "declined") return { text: t.statusDeclined, cls: "bg-red-100 text-red-800" };
    if (x.status === "sent" && x.viewed_at) return { text: fill(q.viewed, { when: whenText(x.viewed_at, lang) }), cls: "bg-amber-100 text-amber-900" };
    if (x.status === "sent") return { text: fill(q.sentAgo, { when: whenText(x.sent_at ?? x.updated_at, lang) }), cls: "bg-blue-100 text-blue-800" };
    return { text: t.statusDraft, cls: "bg-slate-100 text-slate-700" };
  };

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold">{t.navQuotes}</h1>
      <Link href="/dashboard/quotes/new" className="block rounded-2xl bg-orange-600 px-4 py-4 text-center text-lg font-bold text-white shadow-sm">
        + {t.newQuote}
      </Link>

      {quotes.length > 0 && (
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {TABS.map((tb) => (
            <Link
              key={tb}
              href={tb === "all" ? "/dashboard/quotes" : `/dashboard/quotes?tab=${tb}`}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
                tab === tb ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {tabLabel[tb]} {count(tb)}
            </Link>
          ))}
        </nav>
      )}

      {quotes.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">{t.noQuotes}</p>}
      {quotes.length > 0 && shown.length === 0 && <p className="text-slate-600">{q.noneHere}</p>}
      <ul className="space-y-2">
        {shown.map((x) => {
          const s = status(x);
          return (
            <li key={x.id}>
              <Link href={`/dashboard/quotes/${x.id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0 break-words font-semibold">{x.title}</span>
                  <span className="shrink-0 font-semibold">{euro(quoteTotals(x.lines).incl)}</span>
                </span>
                <span className="mt-0.5 block text-sm text-slate-500">
                  {x.number}
                  {x.client_name ? ` · ${x.client_name}` : ""}
                </span>
                <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.text}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
