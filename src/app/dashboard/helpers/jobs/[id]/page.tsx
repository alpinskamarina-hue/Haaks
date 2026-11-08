import { notFound } from "next/navigation";
import { decideHelperReply } from "@/app/company-actions";
import { CompanyReplies } from "@/components/CompanyReplies";
import type { CompanyJob } from "@/lib/company-jobs";
import { getHelperDict } from "@/lib/helper-i18n";
import type { CompanyReply } from "@/lib/job-replies";
import { loadWorkspace } from "@/lib/workspace";
import { getOndernemerDict, ondernemerByPassport, SIGNS } from "@/lib/ondernemer";
import { createServerAccountClient } from "@/lib/supabase/server";

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
  const list = (replies ?? []) as CompanyReply[];
  const ondernemer = await ondernemerByPassport(await createServerAccountClient(), list.map((r) => r.passport_token)).catch(() => new Map());
  const od = getOndernemerDict(lang);
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <CompanyReplies
        job={job}
        replies={list}
        t={getHelperDict(lang)}
        lang={lang}
        ok={ok}
        decideAction={decideHelperReply}
        base="/dashboard/helpers"
        ondernemer={ondernemer}
        ondernemerText={{ title: od.badge, lines: Object.fromEntries(SIGNS.map((id) => [id, od.signs[id].ok])) }}
      />
    </main>
  );
}
