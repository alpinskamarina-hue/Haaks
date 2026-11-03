import Link from "next/link";
import { closeHelperJob } from "@/app/company-actions";
import { companyCard as card, CompanyJobRow, CompanyNotice } from "@/components/CompanyJobs";
import { fill } from "@/lib/company-i18n";
import { FREE_ACTIVE_JOBS, isActive, type CompanyJob } from "@/lib/company-jobs";
import { getHelperDict } from "@/lib/helper-i18n";
import { loadWorkspace } from "@/lib/workspace";

// "Need a helper": jobs this builder posted for other builders, with their replies.
export default async function HelperJobsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { supabase, user, profile, lang } = await loadWorkspace();
  const sp = await searchParams;
  const [{ data: jobs }, { data: replyRows }] = await Promise.all([
    supabase.from("company_jobs").select("*").eq("company_id", user.id).order("created_at", { ascending: false }).returns<CompanyJob[]>(),
    // RLS: the builder's own replies and replies to the builder's own jobs.
    supabase.from("job_replies").select("job_id, status, worker_id").neq("worker_id", user.id).returns<{ job_id: string; status: string }[]>(),
  ]);
  const replies = new Map<string, { total: number; fresh: number }>();
  for (const r of replyRows ?? []) {
    const c = replies.get(r.job_id) ?? { total: 0, fresh: 0 };
    c.total += 1;
    if (r.status === "sent") c.fresh += 1;
    replies.set(r.job_id, c);
  }
  const t = getHelperDict(lang);
  const list = jobs ?? [];
  const active = list.filter((j) => isActive(j)).length;
  const verified = Boolean((profile as typeof profile & { company_verified?: boolean }).company_verified);
  const missing = !profile.full_name || !profile.phone;

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">👷 {t.title}</h1>
        <p className="mt-1 text-slate-600">{t.intro}</p>
      </div>
      <CompanyNotice t={t} ok={sp.ok} error={sp.error} />
      {missing ? (
        <Link href="/dashboard/profile" className="block rounded-lg bg-amber-50 p-3 text-sm text-amber-800 underline-offset-2 hover:underline">
          {t.errors.details}
        </Link>
      ) : active >= FREE_ACTIVE_JOBS ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{fill(t.limitReached, { max: FREE_ACTIVE_JOBS })}</p>
      ) : (
        <Link href="/dashboard/helpers/new" className="block rounded-lg bg-orange-600 px-4 py-3 text-center font-semibold text-white">
          {t.newJob}
        </Link>
      )}
      <p className="text-right text-sm text-slate-500">{fill(t.activeCount, { n: active, max: FREE_ACTIVE_JOBS })}</p>
      {!verified && list.some((j) => j.status === "pending") && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-600">{t.pendingNote}</p>}
      {list.length === 0 ? (
        <p className={`${card} text-center text-slate-500`}>{t.noJobs}</p>
      ) : (
        <ul className="space-y-3">
          {list.map((job) => (
            <CompanyJobRow key={job.id} job={job} t={t} lang={lang} replies={replies.get(job.id)} base="/dashboard/helpers" closeAction={closeHelperJob} />
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-500">{t.contactNote}</p>
    </main>
  );
}
