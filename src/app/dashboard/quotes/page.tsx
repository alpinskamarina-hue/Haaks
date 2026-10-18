import Link from "next/link";
import { QuoteRequestForm } from "@/components/QuoteRequestForm";
import { QuoteStatusBadge } from "@/components/QuoteStatusBadge";
import { euro } from "@/lib/orders";
import { quoteTotals, type Quote } from "@/lib/quotes";
import { loadWorkspace } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const { supabase, user, profile, t } = await loadWorkspace();

  const [{ data: openRows }, { data: quoteRows }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, title")
      .eq("user_id", user.id)
      .eq("status", "open")
      .order("created_at", { ascending: false }),
    supabase
      .from("quotes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<Quote[]>(),
  ]);
  const orders = openRows ?? [];
  const quotes = quoteRows ?? [];
  const defaultOrderId =
    (order && orders.some((o) => o.id === order) ? order : null) ?? profile.current_order_id ?? null;
  const rate = (profile as { hourly_rate?: number | string | null }).hourly_rate;

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">

      <section className={card}>
        <h1 className="mb-3 text-2xl font-bold">{t.newQuote}</h1>
        <QuoteRequestForm
          t={t}
          userId={user.id}
          orders={orders}
          defaultOrderId={defaultOrderId}
          defaultRate={rate ? Number(rate) : null}
        />
      </section>

      <section className={card}>
        <h2 className="mb-4 text-xl font-semibold">{t.quotesTitle}</h2>
        {quotes.length === 0 && <p className="text-slate-600">{t.noQuotes}</p>}
        <ul className="divide-y divide-slate-100">
          {quotes.map((q) => (
            <li key={q.id}>
              <Link href={`/dashboard/quotes/${q.id}`} className="flex items-center justify-between gap-3 py-3">
                <span>
                  <span className="block font-medium">{q.title}</span>
                  <span className="text-sm text-slate-500">
                    {q.number}
                    {q.client_name ? ` · ${q.client_name}` : ""}
                  </span>
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
    </main>
  );
}
