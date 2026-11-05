import Link from "next/link";
import { claudeEnabled } from "@/lib/env";
import { QuoteRequestForm } from "@/components/QuoteRequestForm";
import { getQuotesDict } from "@/lib/quotes-i18n";
import { loadWorkspace } from "@/lib/workspace";

// New quote: describe the job (and photos); ready work lines are added on the next screen.
export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const { supabase, user, profile, lang, t } = await loadWorkspace();
  const { data: openRows } = await supabase
    .from("orders")
    .select("id, title")
    .eq("user_id", user.id)
    .eq("status", "open")
    .order("created_at", { ascending: false });
  const orders = openRows ?? [];
  const defaultOrderId = [order, profile.current_order_id].find((id) => id && orders.some((o) => o.id === id)) ?? null;
  const rate = (profile as { hourly_rate?: number | string | null }).hourly_rate;
  const ai = claudeEnabled();

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <Link href="/dashboard/quotes" className="text-sm text-slate-600 underline">
        ← {t.navQuotes}
      </Link>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="mb-3 text-2xl font-bold">{t.newQuote}</h1>
        <QuoteRequestForm
          t={t}
          userId={user.id}
          orders={orders}
          defaultOrderId={defaultOrderId}
          defaultRate={rate ? Number(rate) : null}
          aiEnabled={ai}
          manualHint={ai ? null : getQuotesDict(lang).manualHint}
        />
      </section>
    </main>
  );
}
