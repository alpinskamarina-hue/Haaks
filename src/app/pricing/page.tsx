import type { Metadata } from "next";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PricingPlans, type Period, type PricingViewer } from "@/components/PricingPlans";
import { SiteFooter } from "@/components/SiteFooter";
import { getDict, isLang } from "@/lib/i18n";
import { getLanding } from "@/lib/landing";
import { requestLang } from "@/lib/lang";
import { founderOffer, planOf } from "@/lib/plans";
import { getPricingDict } from "@/lib/pricing-i18n";
import { createClient } from "@/lib/supabase/server";
import { startUltraTrial } from "../plan-actions";

export const metadata: Metadata = { title: "Tarieven · Haaks" };

// Public «Тарифы» page. Signed-in builders see their own plan on the cards.
export default async function PricingPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: periodParam } = await searchParams;
  const period: Period = periodParam === "year" ? "year" : "month";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("language, account_type, plan, plan_until, trial_started_at").eq("id", user.id).maybeSingle()
    : { data: null };
  const lang = isLang(profile?.language) ? profile.language : await requestLang();
  const t = getDict(lang);
  const p = getPricingDict(lang);
  const worker = profile && profile.account_type !== "company";
  const plan = planOf(profile);
  const viewer: PricingViewer = worker
    ? { plan, trial: Boolean(profile.trial_started_at && plan === "ultra"), trialAvailable: !profile.trial_started_at && plan === "free" }
    : null;
  const offer = await founderOffer(supabase);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href={user ? "/dashboard" : "/"} className="text-xl font-bold">
            Haaks<span className="text-orange-600">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher current={lang} label={t.language} />
            {!user && (
              <Link
                href="/?mode=signin#signup"
                className="inline-flex items-center rounded-lg border-2 border-orange-600 px-4 py-2 text-sm font-semibold text-orange-700"
              >
                {getLanding(lang).login}
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{p.title}</h1>
          <p className="mt-2 text-slate-600">{p.subtitle}</p>
        </div>
        <PricingPlans
          t={p}
          period={period}
          periodHref={(x) => (x === "year" ? "/pricing?period=year" : "/pricing")}
          offer={offer}
          viewer={viewer}
          trialAction={startUltraTrial}
        />
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
