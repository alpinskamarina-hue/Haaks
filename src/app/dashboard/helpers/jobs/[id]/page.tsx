import { notFound } from "next/navigation";
import { decideHelperReply } from "@/app/company-actions";
import { CompanyReplies } from "@/components/CompanyReplies";
import type { CompanyJob } from "@/lib/company-jobs";
import { getHelperDict } from "@/lib/helper-i18n";
import type { CompanyReply } from "@/lib/job-replies";
import { loadWorkspace } from "@/lib/workspace";

export default async function HelperJobRepliesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { supabase, user, lang } = await loadWorkspace();
  const { id } = await params;
  const { ok } = await searchParams;
  const [{ data: job }, { data: replies }] = await Promise.all([
    supabase
      .from("company_jobs")
      .select("id, title, city, trades")
      .eq("id", id)
      .eq("company_id", user.id)
      .maybeSingle<Pick<CompanyJob, "id" | "title" | "city" | "trades">>(),
    supabase.rpc("job_replies_for_company", { p_job: id }),
  ]);
  if (!job) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <CompanyReplies
        job={job}
        replies={(replies ?? []) as CompanyReply[]}
        t={getHelperDict(lang)}
        lang={lang}
        ok={ok}
        decideAction={decideHelperReply}
        base="/dashboard/helpers"
      />
    </main>
  );
}
