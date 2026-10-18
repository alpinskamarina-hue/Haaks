import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { LeadCard } from "@/components/LeadCard";
import { readiness, REQUIREMENTS, type DocumentRow } from "@/lib/documents";
import { invoiceTotals, type Invoice } from "@/lib/invoices";
import type { Lead } from "@/lib/leads";
import { euro, inQuarter, quarterOf, totals, type Order, type Receipt } from "@/lib/orders";
import type { Quote } from "@/lib/quotes";
import { loadWorkspace } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

// Home: what needs attention today across all services.
export default async function Home() {
  const { supabase, user, profile, lang, t } = await loadWorkspace();

  const [{ data: leadRows }, { data: quoteRows }, { data: invoiceRows }, { data: receiptRows }, { data: docs }, { data: current }] =
    await Promise.all([
      supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "new")
        .order("match_score", { ascending: false, nullsFirst: false })
        .limit(20)
        .returns<Lead[]>(),
      supabase.from("quotes").select("status, lines").eq("user_id", user.id).returns<Pick<Quote, "status" | "lines">[]>(),
      supabase
        .from("invoices")
        .select("status, lines, vat_mode, due_date")
        .eq("user_id", user.id)
        .returns<Pick<Invoice, "status" | "lines" | "vat_mode" | "due_date">[]>(),
      supabase.from("receipts").select("*").eq("user_id", user.id).returns<Receipt[]>(),
      supabase.from("documents").select("*").eq("user_id", user.id).returns<DocumentRow[]>(),
      profile.current_order_id
        ? supabase.from("orders").select("*").eq("id", profile.current_order_id).maybeSingle<Order>()
        : Promise.resolve({ data: null }),
    ]);

  const leads = leadRows ?? [];
  const waitingQuotes = (quoteRows ?? []).filter((q) => q.status === "sent").length;
  const unpaid = (invoiceRows ?? []).filter((i) => i.status === "sent");
  const today = new Date().toISOString().slice(0, 10);
  const overdue = unpaid.filter((i) => i.due_date && i.due_date < today).length;
  const quarter = quarterOf(new Date());
  const vatPaid = totals((receiptRows ?? []).filter((r) => inQuarter(r, quarter))).vat;
  const ready = readiness(profile, docs ?? []);
  const readyCount = REQUIREMENTS.filter((r) => ready[r]).length;
  const firstName = profile.full_name?.split(" ")[0];

  const stats: { href: string; label: string; value: string; note?: string; warn?: boolean }[] = [
    { href: "/dashboard/leads", label: t.homeNewLeads, value: String(leads.length) },
    { href: "/dashboard/quotes", label: t.homeQuotesWaiting, value: String(waitingQuotes) },
    {
      href: "/dashboard/invoices",
      label: t.unpaid,
      value: euro(unpaid.reduce((s, i) => s + invoiceTotals(i.lines, i.vat_mode).incl, 0)),
      note: overdue ? t.homeOverdue.replace("{n}", String(overdue)) : undefined,
      warn: overdue > 0,
    },
    { href: "/dashboard/orders", label: t.vatQuarter.replace("{q}", quarter.label), value: euro(vatPaid) },
  ];

  const actions: { href: string; label: string; icon: IconName }[] = [
    { href: current ? `/dashboard/orders/${current.id}` : "/dashboard/orders", label: t.homeActionReceipt, icon: "camera" },
    { href: "/dashboard/leads", label: t.homeActionLead, icon: "search" },
    { href: "/dashboard/quotes", label: t.newQuote, icon: "quote" },
    { href: "/dashboard/invoices", label: t.newInvoice, icon: "invoice" },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">{firstName ? t.homeHello.replace("{name}", firstName) : t.navHome}</h1>
        <p className="text-slate-600">{t.homeSubtitle}</p>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`${card} !p-4 hover:border-orange-300`}>
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
            {s.note && <p className={`text-xs ${s.warn ? "text-red-700" : "text-slate-500"}`}>{s.note}</p>}
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex flex-col items-center gap-2 rounded-2xl bg-orange-600 p-4 text-center text-sm font-semibold text-white shadow-sm hover:bg-orange-700"
          >
            <Icon name={a.icon} className="h-7 w-7" />
            {a.label}
          </Link>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className={card}>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">{t.homeLeadsTitle}</h2>
            <Link href="/dashboard/leads" className="text-sm text-orange-700 underline">
              {t.homeAll}
            </Link>
          </div>
          {leads.length === 0 ? (
            <p className="text-slate-600">{t.homeNoLeads}</p>
          ) : (
            <ul className="space-y-3">
              {leads.slice(0, 3).map((lead) => (
                <LeadCard key={lead.id} lead={lead} t={t} lang={lang} />
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-5">
          <section className={card}>
            <h2 className="text-sm font-medium text-slate-500">{t.currentOrder}</h2>
            {current ? (
              <Link href={`/dashboard/orders/${current.id}`} className="mt-1 block">
                <p className="text-lg font-semibold">{current.title}</p>
                <p className="text-sm text-slate-600">
                  {[current.client_name, current.address].filter(Boolean).join(" · ")}
                </p>
              </Link>
            ) : (
              <p className="mt-1 text-sm text-slate-600">{t.noCurrentOrder}</p>
            )}
          </section>

          <Link href="/dashboard/passport" className={`${card} block hover:border-orange-300`}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{t.passportTitle}</h2>
              <span className="font-bold">
                {readyCount} / {REQUIREMENTS.length}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${readyCount === REQUIREMENTS.length ? "bg-green-600" : "bg-orange-500"}`}
                style={{ width: `${(readyCount / REQUIREMENTS.length) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {readyCount === REQUIREMENTS.length
                ? t.homePassportReady
                : t.homeMissing.replace("{x}", t[`req_${REQUIREMENTS.find((r) => !ready[r])!}`])}
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
