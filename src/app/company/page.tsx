import Link from "next/link";
import { companyCard as card, CompanyDetailsForm, CompanyJobRow, CompanyNotice } from "@/components/CompanyJobs";
import { requireUser } from "@/lib/auth";
import { companyLang, fill, getCompanyDict } from "@/lib/company-i18n";
import { FREE_ACTIVE_JOBS, isActive, type CompanyInfo, type CompanyJob } from "@/lib/company-jobs";

export default async function CompanyPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; edit?: string }> }) {
  const { supabase, user } = await requireUser();
  const sp = await searchParams;
  const [{ data: profile }, { data: jobs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("company_name, kvk_number, full_name, phone, business_email, language, company_verified")
      .eq("id", user.id)
      .single<CompanyInfo & { language: string; company_verified: boolean }>(),
    supabase.from("company_jobs").select("*").eq("company_id", user.id).order("created_at", { ascending: false }).returns<CompanyJob[]>(),
  ]);
  const t = getCompanyDict(companyLang(profile?.language));
  const ready = Boolean(profile?.company_name && profile.kvk_number && profile.full_name && profile.phone);
  const list = jobs ?? [];
  const active = list.filter((j) => isActive(j)).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="mt-1 text-slate-600">{t.intro}</p>
      </div>
      <CompanyNotice t={t} ok={sp.ok} error={sp.error} />

      {!ready || sp.edit ? (
        <CompanyDetailsForm t={t} profile={profile} email={user.email ?? ""} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{profile!.company_name}</span> · KvK {profile!.kvk_number} ·{" "}
              <Link href="/company?edit=1" className="text-orange-700 underline-offset-2 hover:underline">
                {t.editDetails}
              </Link>
            </p>
            <p className="text-sm text-slate-500">{fill(t.activeCount, { n: active, max: FREE_ACTIVE_JOBS })}</p>
          </div>
          {active >= FREE_ACTIVE_JOBS ? (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{fill(t.limitReached, { max: FREE_ACTIVE_JOBS })}</p>
          ) : (
            <Link href="/company/new" className="block rounded-lg bg-orange-600 px-4 py-3 text-center font-semibold text-white">
              {t.newJob}
            </Link>
          )}
          {!profile!.company_verified && list.some((j) => j.status === "pending") && (
            <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-600">{t.pendingNote}</p>
          )}
          {list.length === 0 ? (
            <p className={`${card} text-center text-slate-500`}>{t.noJobs}</p>
          ) : (
            <ul className="space-y-3">
              {list.map((job) => (
                <CompanyJobRow key={job.id} job={job} t={t} lang={companyLang(profile?.language)} />
              ))}
            </ul>
          )}
          <p className="text-xs text-slate-500">{t.contactNote}</p>
        </>
      )}
    </div>
  );
}

