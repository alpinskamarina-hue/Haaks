import { CompanyCatalog, type CatalogWorker, type SentInvite } from "@/components/CompanyCatalog";
import { requireUser } from "@/lib/auth";
import { companyLang, getCompanyDict } from "@/lib/company-i18n";
import { JOB_TRADES } from "@/lib/company-jobs";
import { ondernemerByPassport } from "@/lib/ondernemer";
import { createServerAccountClient } from "@/lib/supabase/server";

export default async function CompanyBuildersPage({ searchParams }: { searchParams: Promise<{ trade?: string; ok?: string; error?: string }> }) {
  const { supabase, user } = await requireUser();
  const sp = await searchParams;
  const [{ data: profile }, { data: workers }, { data: invites }, { data: jobs }, { data: reports }, { data: workCounts }, { data: ratings }] = await Promise.all([
    supabase.from("profiles").select("language").eq("id", user.id).single(),
    supabase.rpc("worker_catalog"),
    supabase.rpc("company_sent_invites"),
    supabase.from("company_jobs").select("id, title").eq("company_id", user.id).eq("status", "published").gt("expires_at", new Date().toISOString()),
    supabase.from("reports").select("target_id").eq("target_kind", "worker"),
    supabase.rpc("catalog_work_counts"),
    supabase.rpc("catalog_ratings"),
  ]);
  const rated = new Map(((ratings ?? []) as { worker_id: string; avg_stars: number; n: number }[]).map((r) => [r.worker_id, r]));
  const works = new Map(((workCounts ?? []) as { worker_id: string; n: number }[]).map((r) => [r.worker_id, r.n]));
  // «Zelfstandig ondernemer» per builder, only for builders this company can see in the catalog.
  const ondernemer = await ondernemerByPassport(await createServerAccountClient(), ((workers ?? []) as CatalogWorker[]).map((w) => w.passport_token)).catch(
    () => new Map(),
  );
  const lang = companyLang(profile?.language);
  const trade = sp.trade && JOB_TRADES.includes(sp.trade) ? sp.trade : null;
  return (
    <CompanyCatalog
      workers={((workers ?? []) as CatalogWorker[]).map((w) => ({
        ...w,
        works: works.get(w.id) ?? 0,
        ondernemer: w.passport_token ? ondernemer.get(w.passport_token) : undefined,
        rating: rated.get(w.id) ? { avg: Number(rated.get(w.id)!.avg_stars), n: rated.get(w.id)!.n } : null,
      }))}
      invites={(invites ?? []) as SentInvite[]}
      jobs={jobs ?? []}
      trade={trade}
      t={getCompanyDict(lang)}
      lang={lang}
      ok={sp.ok}
      error={sp.error}
      reported={new Set((reports ?? []).map((r) => r.target_id as string))}
    />
  );
}
