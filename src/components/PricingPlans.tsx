import Link from "next/link";
import { PricingCalc } from "@/components/PricingCalc";
import { SubmitButton } from "@/components/SubmitButton";
import { daysLeft, FOUNDER_COUNTER_FROM, PRICES, TRIAL_DAYS, type FounderOffer, type Plan } from "@/lib/plans";
import type { PricingDict } from "@/lib/pricing-i18n";
import { fill } from "@/lib/quotes-i18n";

export type Period = "month" | "year";
// viewer = null for visitors who are not signed in.
export type PricingViewer = { plan: Plan; trial: boolean; trialAvailable: boolean } | null;

const money = (n: number) => new Intl.NumberFormat("nl-NL", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n);

// Plans Free, Pro and Ultra: period switch, founder offer, three cards, savings calculator,
// comparison and questions. Used on the public «Тарифы» page and in «Мой тариф».
export function PricingPlans({
  t,
  period,
  periodHref,
  offer,
  viewer,
  trialAction,
}: {
  t: PricingDict;
  period: Period;
  periodHref: (p: Period) => string;
  offer: FounderOffer;
  viewer: PricingViewer;
  trialAction: () => Promise<void>;
}) {
  const founder = offer.open;
  const price = (plan: "pro" | "ultra") => {
    const p = PRICES[plan];
    const full = period === "year" ? p.year : p.month;
    const now = founder ? (period === "year" ? p.founderYear : p.founder) : full;
    return { full, now };
  };
  const per = period === "year" ? t.perYear : t.perMonth;
  const signup = "/#signup";
  const btn = "block w-full rounded-xl px-4 py-3 text-center font-bold";
  const current = (cls: string) => <p className={`${btn} ${cls}`}>✓ {t.yourPlan}</p>;
  const soon = (cls: string) => (
    <p className={`${btn} ${cls}`} aria-disabled>
      {t.paySoon}
    </p>
  );

  const priceLine = (plan: "pro" | "ultra", dark: boolean) => {
    const { full, now } = price(plan);
    return (
      <>
        <p className="mt-3 flex items-baseline gap-2">
          {founder && <s className="text-slate-400">{full} €</s>}
          <span className="text-4xl font-bold">{now} €</span>
          <span className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{per}</span>
        </p>
        <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{fill(t.withBtw, { sum: `${money(now * 1.21)} €` })}</p>
        {founder && <p className={`mt-1 text-sm font-semibold ${dark ? "text-amber-300" : "text-orange-700"}`}>{t.founderForever}</p>}
      </>
    );
  };

  const points = (list: string[], mark: string) => (
    <ul className="mt-4 space-y-2 text-sm">
      {list.map((x) => (
        <li key={x} className="flex gap-2">
          <span className={mark}>✓</span>
          {x}
        </li>
      ))}
    </ul>
  );

  const days = offer.endsAt ? daysLeft(offer.endsAt) : 0;
  const showCount = offer.founders >= FOUNDER_COUNTER_FROM;

  return (
    <div className="space-y-5">
      <div className="mx-auto grid max-w-sm grid-cols-2 rounded-xl bg-slate-200 p-1 text-center text-sm">
        {(["month", "year"] as const).map((p) => (
          <Link
            key={p}
            href={periodHref(p)}
            scroll={false}
            className={`rounded-lg px-3 py-2 ${period === p ? "bg-white font-semibold shadow-sm" : "text-slate-600"}`}
          >
            {p === "month" ? t.month : t.year}
            {p === "year" && <span className="ml-1 font-semibold text-green-700">{t.yearSave}</span>}
          </Link>
        ))}
      </div>

      {founder ? (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p>
            🎉 <b>{fill(t.founderOpen, { limit: offer.limit })}</b>
          </p>
          <div className={`mt-3 grid gap-2 text-center ${showCount ? "grid-cols-3" : "grid-cols-1"}`}>
            <p className="rounded-lg bg-white px-2 py-2">
              <b className="block text-xl text-orange-800">{days}</b>
              {t.founderDays}
            </p>
            {showCount && (
              <>
                <p className="rounded-lg bg-white px-2 py-2">
                  <b className="block text-xl text-orange-800">{offer.founders}</b>
                  {t.founderCount}
                </p>
                <p className="rounded-lg bg-white px-2 py-2">
                  <b className="block text-xl text-orange-800">{offer.placesLeft}</b>
                  {t.founderPlaces}
                </p>
              </>
            )}
          </div>
          {showCount && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-200">
              <div className="h-full bg-orange-600" style={{ width: `${Math.min(100, (offer.founders / offer.limit) * 100)}%` }} />
            </div>
          )}
        </section>
      ) : (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          🎉 {fill(t.founderSoon, { pro: PRICES.pro.founder, ultra: PRICES.ultra.founder, limit: offer.limit })}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        <section className="order-1 rounded-2xl border-2 border-orange-500 bg-white p-5 shadow-sm lg:order-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold">{t.pro.name}</h2>
            <span className="rounded-full bg-orange-600 px-2.5 py-0.5 text-xs font-bold uppercase text-white">{t.popular}</span>
          </div>
          <p className="text-sm text-slate-500">{t.pro.tag}</p>
          {priceLine("pro", false)}
          {points(t.pro.points, "text-green-600")}
          <div className="mt-5">
            {!viewer ? (
              <Link href={signup} className={`${btn} bg-orange-600 text-white`}>
                {t.takePro}
              </Link>
            ) : viewer.plan === "pro" ? (
              current("bg-orange-50 text-orange-800")
            ) : (
              soon("bg-orange-100 text-orange-800")
            )}
          </div>
        </section>

        <section className="order-2 rounded-2xl bg-slate-900 p-5 text-white shadow-sm lg:order-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold">{t.ultra.name}</h2>
            <span className="rounded-full bg-gradient-to-r from-orange-500 to-fuchsia-500 px-2.5 py-0.5 text-xs font-bold text-white">{t.withAi}</span>
          </div>
          <p className="text-sm text-slate-400">{t.ultra.tag}</p>
          {priceLine("ultra", true)}
          {points(t.ultra.points, "text-amber-400")}
          <div className="mt-5">
            {!viewer ? (
              <Link href={signup} className={`${btn} bg-white text-slate-900`}>
                {fill(t.tryUltra, { n: TRIAL_DAYS })}
              </Link>
            ) : viewer.trialAvailable ? (
              <form action={trialAction}>
                <SubmitButton className={`${btn} bg-white text-slate-900`}>{fill(t.tryUltra, { n: TRIAL_DAYS })}</SubmitButton>
              </form>
            ) : viewer.plan === "ultra" && !viewer.trial ? (
              current("bg-white/10 text-white")
            ) : (
              soon("bg-white/10 text-white")
            )}
          </div>
        </section>

        <section className="order-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:order-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold">{t.free.name}</h2>
            <span className="text-2xl font-bold">0 €</span>
          </div>
          <p className="text-sm text-slate-500">{t.free.tag}</p>
          {points(t.free.points, "text-slate-400")}
          <div className="mt-5">
            {!viewer ? (
              <Link href={signup} className={`${btn} border-2 border-slate-300 text-slate-800`}>
                {t.startFree}
              </Link>
            ) : viewer.plan === "free" ? (
              current("border-2 border-slate-200 text-slate-600")
            ) : null}
          </div>
        </section>
      </div>

      <PricingCalc
        price={Math.round(price("ultra").now / (period === "year" ? 12 : 1))}
        t={{
          title: t.calcTitle,
          rate: t.calcRate,
          hours: t.calcHours,
          hourUnit: t.calcHourUnit,
          hoursUnit: t.calcHoursUnit,
          time: t.calcTime,
          cost: t.calcCost,
          plus: t.calcPlus,
        }}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">{t.compareTitle}</h2>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 text-left font-normal" />
              <th className="w-16 py-2 font-medium sm:w-24">Free</th>
              <th className="w-16 py-2 font-medium sm:w-24">Pro</th>
              <th className="w-16 py-2 font-medium sm:w-24">Ultra</th>
            </tr>
          </thead>
          <tbody>
            {t.rows.map(([label, ...cells]) => (
              <tr key={label} className="border-b border-slate-100 last:border-0">
                <td className="py-2.5 pr-2">{label}</td>
                {cells.map((c, i) => (
                  <td key={i} className={`py-2.5 text-center ${c === "✓" ? "font-bold text-green-600" : c === "—" ? "text-slate-300" : "text-xs text-slate-500"}`}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">{t.faqTitle}</h2>
        <div className="mt-2 divide-y divide-slate-100">
          {t.faq.map(([q, a]) => (
            <details key={q} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">
                {q}
                <span className="text-slate-400 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
