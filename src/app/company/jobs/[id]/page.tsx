import { notFound } from "next/navigation";
import { decideJobReply } from "@/app/company-actions";
import { CompanyReplies } from "@/components/CompanyReplies";
import { requireUser } from "@/lib/auth";
import { companyLang, getCompanyDict } from "@/lib/company-i18n";
import type { CompanyJob } from "@/lib/company-jobs";
import type { CompanyReply } from "@/lib/job-replies";

export default async function CompanyJobRepliesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const { id } = await params;
  const { ok } = await searchParams;
  const [{ data: profile }, { data: job }, { data: replies }] = await Promise.all([
    supabase.from("profiles").select("language").eq("id", user.id).single(),
    supabase.from("company_jobs").select("id, title, city, trades").eq("id", id).maybeSingle<Pick<CompanyJob, "id" | "title" | "city" | "trades">>(),
    supabase.rpc("job_replies_for_company", { p_job: id }),
  ]);
  if (!job) notFound();
  const lang = companyLang(profile?.language);
  return <CompanyReplies job={job} replies={(replies ?? []) as CompanyReply[]} t={getCompanyDict(lang)} lang={lang} ok={ok} decideAction={decideJobReply} />;
}
