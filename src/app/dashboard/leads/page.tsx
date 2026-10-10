import Link from "next/link";
import { saveLeadRegions } from "@/app/leads-actions";
import { LeadCard } from "@/components/LeadCard";
import { LeadForm } from "@/components/LeadForm";
import type { Lead } from "@/lib/leads";
import { loadWorkspace } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const TABS = ["new", "replied", "won", "dismissed"] as const;

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tabParam = (await searchParams).tab;
  const tab = (TABS as readonly string[]).includes(tabParam ?? "") ? (tabParam as Lead["status"]) : "new";
  const { supabase, user, profile, lang, t } = await loadWorkspace();

  const { data: rows } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<Lead[]>();
  const leads = rows ?? [];
  const shown = leads
    .filter((l) => l.status === tab)
    .sort((a, b) => (tab === "new" ? (b.match_score ?? -1) - (a.match_score ?? -1) : 0));
  const tabLabel = { new: t.leadTabNew, replied: t.leadTabReplied, won: t.leadTabWon, dismissed: t.leadTabDismissed };
  const regions = profile.lead_regions ?? profile.city ?? "";
  const field = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2";

  const sources: [string, string, boolean][] = [
    [t.leadSrcManual, t.leadSrcManualHint, true],
    [t.leadSrcTelegram, t.leadSrcTelegramHint, false],
    [t.leadSrcPermits, t.leadSrcPermitsHint, false],
    [t.leadSrcEmail, t.leadSrcEmailHint, false],
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">{t.leadsTitle}</h1>
        <p className="text-slate-600">{t.leadsSubtitle}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className={card}>
            <h2 className="mb-1 font-semibold">{t.leadPasteTitle}</h2>
            <p className="mb-3 text-sm text-slate-600">{t.leadPasteHint}</p>
            <LeadForm t={t} userId={user.id} />
          </section>

          <section className={card}>
            <nav className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1">
              {TABS.map((key) => {
                const n = leads.filter((l) => l.status === key).length;
                return (
                  <Link
                    key={key}
                    href={key === "new" ? "/dashboard/leads" : `/dashboard/leads?tab=${key}`}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${tab === key ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                  >
                    {tabLabel[key]} {n > 0 && <span className="opacity-70">{n}</span>}
                  </Link>
                );
              })}
            </nav>
            {shown.length === 0 && <p className="text-slate-600">{t.noLeads}</p>}
            <ul className="space-y-3">
              {shown.map((lead) => (
                <LeadCard key={lead.id} lead={lead} t={t} lang={lang} />
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          <section className={card}>
            <h2 className="mb-3 font-semibold">{t.leadProfileTitle}</h2>
            <form action={saveLeadRegions} className="space-y-3">
              <label className="block text-sm font-medium">
                {t.trade}
                <input name="trade" defaultValue={profile.trade ?? ""} className={field} />
              </label>
              <label className="block text-sm font-medium">
                {t.leadRegions}
                <input name="lead_regions" defaultValue={regions} placeholder="Utrecht, Amersfoort" className={field} />
              </label>
              <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{t.save}</button>
            </form>
          </section>

          <section className={card}>
            <h2 className="mb-3 font-semibold">{t.leadSourcesTitle}</h2>
            <ul className="space-y-3">
              {sources.map(([name, hint, live]) => (
                <li key={name} className="flex gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${live ? "bg-green-500" : "bg-slate-300"}`} />
                  <div>
                    <p className="text-sm font-medium">
                      {name}{" "}
                      {!live && (
                        <span className="whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-600">
                          {t.leadSoon}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-600">{hint}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">{t.leadLegalNote}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
