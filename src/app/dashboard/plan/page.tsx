import { PricingPlans, type Period } from "@/components/PricingPlans";
import { freeLeft } from "@/lib/free-limits";
import { AI_LIMITS, daysLeft, founderOffer, planOf, PRICES, TRIAL_DAYS } from "@/lib/plans";
import { getPricingDict } from "@/lib/pricing-i18n";
import { fill } from "@/lib/quotes-i18n";
import { loadWorkspace } from "@/lib/workspace";
import { startUltraTrial } from "../../plan-actions";

// «Мой тариф»: the plan in force, trial days left, AI uses left, and all plans below.
export default async function MyPlanPage({ searchParams }: { searchParams: Promise<{ period?: string; trial?: string }> }) {
  const { period: periodParam, trial: trialResult } = await searchParams;
  const period: Period = periodParam === "year" ? "year" : "month";
  const { supabase, profile, lang } = await loadWorkspace();
  const p = getPricingDict(lang);
  const extra = profile as typeof profile & { plan?: string; plan_until?: string | null; trial_started_at?: string | null };
  const plan = planOf(extra);
  const trial = Boolean(extra.trial_started_at && plan === "ultra");
  const [offer, ai] = await Promise.all([founderOffer(supabase), freeLeft(supabase, "ai")]);
  const left = trial && extra.plan_until ? daysLeft(extra.plan_until) : 0;
  const aiLimit = ai.limit ?? AI_LIMITS[plan];
  const message =
    trialResult === "ok" ? fill(p.trialStarted, { n: TRIAL_DAYS }) : trialResult === "used" ? p.trialUsed : trialResult === "error" ? p.trialError : null;

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      {message && (
        <p className={`rounded-xl p-3 text-sm ${trialResult === "ok" ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-900"}`}>{message}</p>
      )}
      <section className={`rounded-2xl p-5 shadow-sm ${plan === "free" ? "border border-slate-200 bg-white" : "bg-gradient-to-br from-slate-900 to-indigo-900 text-white"}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide ${plan === "free" ? "text-slate-500" : "text-slate-300"}`}>{p.myTitle}</p>
        <h1 className="mt-1 text-2xl font-bold">{trial ? p.myTrial : plan === "ultra" ? "Ultra" : plan === "pro" ? "Pro" : "Free"}</h1>
        {trial ? (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full bg-orange-500" style={{ width: `${((TRIAL_DAYS - left) / TRIAL_DAYS) * 100}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-200">{fill(p.myTrialLeft, { n: left, total: TRIAL_DAYS })}</p>
          </>
        ) : (
          <p className={`mt-1 text-sm ${plan === "free" ? "text-slate-600" : "text-slate-200"}`}>
            {plan === "ultra" ? p.myUltra : plan === "pro" ? p.myPro : p.myFree}
            {plan !== "free" && extra.plan_until ? ` ${fill(p.myUntil, { date: new Date(extra.plan_until).toLocaleDateString(lang) })}` : ""}
          </p>
        )}
        <div className={`mt-4 inline-block rounded-xl px-4 py-2 text-center ${plan === "free" ? "bg-slate-50" : "bg-white/10"}`}>
          <p className="text-2xl font-bold">{Math.min(ai.left, aiLimit)}</p>
          <p className={`text-xs ${plan === "free" ? "text-slate-500" : "text-slate-300"}`}>
            {p.myAi} {fill(p.myOf, { n: aiLimit })}
          </p>
        </div>
        {trial && (
          <a href="#plans" className="mt-4 block rounded-xl bg-white px-4 py-3 text-center font-bold text-slate-900">
            {fill(p.myKeepUltra, { sum: offer.open ? PRICES.ultra.founder : PRICES.ultra.month })}
          </a>
        )}
      </section>

      <h2 id="plans" className="scroll-mt-20 pt-2 text-xl font-bold">
        {p.myAllPlans}
      </h2>
      <PricingPlans
        t={p}
        period={period}
        periodHref={(x) => (x === "year" ? "/dashboard/plan?period=year#plans" : "/dashboard/plan#plans")}
        offer={offer}
        viewer={{ plan, trial, trialAvailable: !extra.trial_started_at && plan === "free" }}
        trialAction={startUltraTrial}
      />
    </main>
  );
}
