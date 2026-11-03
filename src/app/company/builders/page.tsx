import { CompanyCatalog, type CatalogWorker, type SentInvite } from "@/components/CompanyCatalog";
import { requireUser } from "@/lib/auth";
import { companyLang, getCompanyDict } from "@/lib/company-i18n";
import { JOB_TRADES } from "@/lib/company-jobs";

export default async function CompanyBuildersPage({ searchParams }: { searchParams: Promise<{ trade?: string; ok?: string; error?: string }> }) {
  const { supabase, user } = await requireUser();
  const sp = await searchParams;
  const [{ data: profile }, { data: workers }, { data: invites }, { data: jobs }] = await Promise.all([
    supabase.from("profiles").select("language").eq("id", user.id).single(),
    supabase.rpc("worker_catalog"),
    supabase.rpc("company_sent_invites"),
    supabase.from("company_jobs").select("id, title").eq("company_id", user.id).eq("status", "published").gt("expires_at", new Date().toISOString()),
  ]);
  const lang = companyLang(profile?.language);
  const trade = sp.trade && JOB_TRADES.includes(sp.trade) ? sp.trade : null;
  return (
    <CompanyCatalog
      workers={(workers ?? []) as CatalogWorker[]}
      invites={(invites ?? []) as SentInvite[]}
      jobs={jobs ?? []}
      trade={trade}
      t={getCompanyDict(lang)}
      lang={lang}
      ok={sp.ok}
      error={sp.error}
    />
  );
}
