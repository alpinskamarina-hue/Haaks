import Link from "next/link";
import { WorkForm } from "@/components/WorkForm";
import { getWorkerDict } from "@/lib/worker-profile-text";
import { TRADES } from "@/lib/worker-profile";
import { getWorksDict } from "@/lib/works-i18n";
import { loadWorkspace } from "@/lib/workspace";
import type { Order } from "@/lib/orders";

// New completed work, optionally started from a closed order (?order=<id>).
export default async function NewWorkPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderId } = await searchParams;
  const { supabase, user, profile, lang, t } = await loadWorkspace();
  const w = getWorksDict(lang);
  const wd = getWorkerDict(lang);
  const order = orderId
    ? (await supabase.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).maybeSingle<Order>()).data
    : null;
  const p = profile as { trades?: string[] | null; city?: string | null };
  const month = new Date().toISOString().slice(0, 7);

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <Link href="/dashboard/works" className="text-sm text-slate-600 underline">
        ← {t.back}
      </Link>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="mb-4 text-2xl font-bold">{w.formNew}</h1>
        <WorkForm
          w={w}
          t={t}
          userId={user.id}
          trades={TRADES.map((id) => ({ id, name: wd.trades[id] }))}
          initial={{
            order_id: order?.id ?? null,
            title: order?.title ?? "",
            description: "",
            trade: p.trades?.length === 1 ? p.trades[0] : "",
            city: p.city ?? "",
            month,
            before: [],
            after: [],
          }}
        />
      </section>
    </main>
  );
}
