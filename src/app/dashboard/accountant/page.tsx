import Link from "next/link";
import { daysBetween, loadQuarter, quarterFromKey, recentQuarters, vatDeadline } from "@/lib/accountant";
import { getAccountantDict } from "@/lib/accountant-i18n";
import { buildPack } from "@/lib/accountant-pack";
import { AccountantZip } from "@/components/AccountantZip";
import { euro } from "@/lib/orders";
import { dutchToday } from "@/lib/quotes";
import { fill } from "@/lib/quotes-i18n";
import type { CarType } from "@/lib/trips";
import { loadWorkspace } from "@/lib/workspace";
import { siteUrl } from "@/lib/lang";
import { QuestionsCard, ShareCard, type QuestionRow, type ShareRow } from "./parts";

const LOCALES = { pl: "pl-PL", ro: "ro-RO", uk: "uk-UA", ru: "ru-RU", tr: "tr-TR", en: "en-GB", nl: "nl-NL" } as const;
const card = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
const row = "flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 last:border-0";

type Check = { tone: "red" | "amber" | "green"; text: string; href?: string };

// «Для бухгалтера»: one quarter in one folder, checked before it goes to the accountant.
export default async function AccountantPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: key } = await searchParams;
  const { supabase, user, profile, lang } = await loadWorkspace();
  const a = getAccountantDict(lang);
  const today = dutchToday();
  const quarters = recentQuarters(today);
  const q = quarterFromKey(key, today);
  const car = (profile as typeof profile & { car_type?: CarType | null }).car_type ?? null;
  const [d, { data: share }, { data: questionRows }] = await Promise.all([
    loadQuarter(supabase, user.id, q, car),
    supabase.from("accountant_shares").select("*").eq("user_id", user.id).eq("quarter", q.key).maybeSingle<ShareRow>(),
    supabase
      .from("accountant_questions")
      .select("id, kind, body, answer_kind, answer, answered_at, created_at, receipts(store_name, purchased_on, total_incl_vat), invoices(number)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40)
      .returns<QuestionRow[]>(),
  ]);
  const shareUrl = share ? `${await siteUrl()}/a/${share.token}` : null;
  const deadline = vatDeadline(q);
  const left = daysBetween(today, deadline);
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(LOCALES[lang], { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
  const receiptHref = (r: { order_id: string | null }) => (r.order_id ? `/dashboard/orders/${r.order_id}?tab=docs` : "/dashboard/orders");

  const c = d.checks;
  const checks: Check[] = [
    ...(c.unread.length ? [{ tone: "red" as const, text: fill(a.cUnread, { n: c.unread.length }), href: receiptHref(c.unread[0]!) }] : []),
    ...c.unpaid.map((i) => ({ tone: "amber" as const, text: fill(a.cUnpaid, { number: i.number, n: daysBetween(i.invoice_date, today) }), href: `/dashboard/invoices/${i.id}` })),
    ...(c.notCompany.length ? [{ tone: "amber" as const, text: fill(a.cNotCompany, { n: c.notCompany.length }), href: receiptHref(c.notCompany[0]!) }] : []),
    ...(c.noOrder.length ? [{ tone: "amber" as const, text: fill(a.cNoOrder, { n: c.noOrder.length }), href: "/dashboard/orders" }] : []),
    ...c.gaps.map((n) => ({ tone: "amber" as const, text: fill(a.cGap, { number: `${q.year}-${String(n).padStart(3, "0")}` }), href: "/dashboard/invoices" })),
    ...(c.drafts.length ? [{ tone: "amber" as const, text: fill(a.cDraft, { n: c.drafts.length }), href: `/dashboard/invoices/${c.drafts[0]!.id}` }] : []),
    ...(!profile.btw_number ? [{ tone: "amber" as const, text: a.cNoBtw, href: "/dashboard/passport" }] : []),
    ...(d.invoices.length && !c.gaps.length ? [{ tone: "green" as const, text: fill(a.okInvoices, { n: d.invoices.length }) }] : []),
    ...(d.receipts.length && !c.unread.length ? [{ tone: "green" as const, text: fill(a.okReceipts, { n: d.receipts.length }) }] : []),
    ...(d.trips.length ? [{ tone: "green" as const, text: fill(a.okTrips, { n: d.trips.length }) }] : []),
  ];
  const toneClass = { red: "bg-red-50 text-red-900", amber: "bg-amber-50 text-amber-900", green: "bg-green-50 text-green-900" };
  const empty = !d.invoices.length && !d.receipts.length && !d.trips.length;
  const pack = buildPack(d, profile, q);
  const paths = pack.receipts.map((r) => r.path);
  const { data: signed } = paths.length ? await supabase.storage.from("documents").createSignedUrls(paths, 60 * 60) : { data: [] };
  const urls = Object.fromEntries((signed ?? []).flatMap((x) => (x.path && x.signedUrl ? [[x.path, x.signedUrl]] : [])));

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">{a.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{a.hint}</p>
      </div>

      <QuestionsCard a={a} lang={lang} questions={questionRows ?? []} fmt={fmt} />

      <nav className="flex gap-1.5">
        {quarters.map((x) => (
          <Link
            key={x.key}
            href={`?q=${x.key}`}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${x.key === q.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}
          >
            Q{x.q} {x.year}
          </Link>
        ))}
      </nav>

      <p className={`rounded-2xl border px-4 py-3 text-sm ${left < 0 ? "border-slate-200 bg-slate-50 text-slate-600" : left <= 14 ? "border-red-200 bg-red-50 text-red-900" : "border-orange-200 bg-orange-50 text-orange-900"}`}>
        ⏰ {fill(a.deadline, { date: fmt(deadline) })} · {left >= 0 ? fill(a.daysLeft, { n: left }) : fill(a.overdue, { n: -left })}
      </p>

      {empty ? (
        <p className={`${card} text-slate-600`}>{a.empty}</p>
      ) : (
        <>
          <section className={card}>
            <div className={row}>
              <span>🧾 {a.invoices} · {d.invoices.length}</span>
              <b>{euro(d.sales.incl)}</b>
            </div>
            <div className={row}>
              <span>🛒 {a.receipts} · {d.receipts.length}</span>
              <b>{euro(d.purchases.incl)}</b>
            </div>
            <div className={row}>
              <span>🚐 {fill(a.trips, { km: Math.round(d.km).toLocaleString(LOCALES[lang]) })}</span>
              <b>{d.kmMoney !== null ? euro(d.kmMoney) : "—"}</b>
            </div>
          </section>

          <section className={card}>
            <p className="mb-1 font-semibold">{a.vatTitle}</p>
            {d.sales.byRate.map(([rate, v]) => (
              <div key={rate} className={row}>
                <span>{fill(a.vatSales, { rate })}</span>
                <b>{euro(v.vat)}</b>
              </div>
            ))}
            {d.sales.reverse > 0 && (
              <div className={row}>
                <span>{a.verlegd}</span>
                <b>{euro(d.sales.reverse)}</b>
              </div>
            )}
            {d.sales.kor > 0 && (
              <div className={row}>
                <span>{a.kor}</span>
                <b>{euro(d.sales.kor)}</b>
              </div>
            )}
            <div className={row}>
              <span>{a.vatBack}</span>
              <b>− {euro(d.purchases.vat)}</b>
            </div>
            <div className={row}>
              <span className="font-semibold">{d.toPay >= 0 ? a.toPay : a.toGet}</span>
              <b className={d.toPay >= 0 ? "text-orange-700" : "text-green-700"}>≈ {euro(Math.abs(d.toPay))}</b>
            </div>
            <p className="mt-2 text-xs text-slate-500">{a.vatNote}</p>
          </section>

          <section className={card}>
            <p className="mb-2 font-semibold">{a.checkTitle}</p>
            <ul className="space-y-1.5 text-sm">
              {checks.map((x) => (
                <li key={x.text} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${toneClass[x.tone]}`}>
                  <span className="min-w-0 flex-1">
                    {x.tone === "green" ? "✓ " : x.tone === "red" ? "⚠️ " : "• "}
                    {x.text}
                  </span>
                  {x.href && (
                    <Link href={x.href} className="shrink-0 font-bold text-orange-700">
                      {a.fix}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <AccountantZip pack={pack} urls={urls} label={a.download} busyLabel={a.busy} errorLabel={a.failed} />
          <p className="text-center text-sm text-slate-600">{a.downloadHint}</p>
          <ShareCard
            a={a}
            share={share ?? null}
            quarterKey={q.key}
            quarterLabel={`Q${q.q} ${q.year}`}
            url={shareUrl}
            name={profile.company_name || profile.full_name || ""}
            fmt={fmt}
          />
        </>
      )}
    </main>
  );
}
