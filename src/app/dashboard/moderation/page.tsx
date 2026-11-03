import { redirect } from "next/navigation";
import { approveCompanyJob, rejectCompanyJob } from "@/app/company-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { dayMonthYear, jobTexts, type CompanyInfo, type CompanyJob } from "@/lib/company-jobs";
import { kvkSearchUrl } from "@/lib/documents";
import { createServerAccountClient } from "@/lib/supabase/server";
import { loadWorkspace } from "@/lib/workspace";

// Haaks checks a company's first jobs before they go into the feed. Admin only, in Russian.
export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { profile } = await loadWorkspace();
  if (!(profile as typeof profile & { is_admin?: boolean }).is_admin) redirect("/dashboard");
  const { ok } = await searchParams;
  const server = await createServerAccountClient();
  const { data: jobs } = await server
    .from("company_jobs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .returns<CompanyJob[]>();
  const ids = [...new Set((jobs ?? []).map((j) => j.company_id))];
  const { data: companies } = ids.length
    ? await server
        .from("profiles")
        .select("id, company_name, kvk_number, full_name, phone, business_email, account_type")
        .in("id", ids)
        .returns<(CompanyInfo & { id: string; account_type: string })[]>()
    : { data: [] };
  const byId = new Map((companies ?? []).map((c) => [c.id, c]));

  return (
    <main className="mx-auto max-w-3xl space-y-5 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Модерация заказов</h1>
        <p className="mt-1 text-slate-600">
          Первые заказы компании или строителя («Нужен помощник») ждут вашей проверки. После первого одобренного заказа автор считается
          проверенным, и его следующие заказы сразу попадают в ленту.
        </p>
      </div>
      {ok && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          {ok === "published" ? "Опубликовано: заказ в ленте «Компании ищут», подходящим строителям ушли уведомления." : "Заказ отклонён."}
        </p>
      )}
      {!jobs?.length ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-center text-slate-500">Нет заказов на проверке.</p>
      ) : (
        <ul className="space-y-4">
          {jobs.map((job) => {
            const c = byId.get(job.company_id);
            const zzp = c?.account_type === "worker";
            const ru = jobTexts(job, "ru", zzp);
            return (
              <li key={job.id} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <p className="text-sm text-slate-500">
                  {dayMonthYear(job.created_at.slice(0, 10))} · {zzp && <span className="mr-1 rounded bg-sky-100 px-1.5 py-0.5 text-xs font-semibold text-sky-800">ZZP · нужен помощник</span>}
                  <span className="font-semibold text-slate-900">{(zzp ? c?.full_name : c?.company_name) ?? "—"}</span>
                  {c?.kvk_number && (
                    <>
                      {" "}
                      · KvK{" "}
                      <a href={kvkSearchUrl(c.kvk_number)} target="_blank" rel="noopener" className="text-blue-700 underline">
                        {c.kvk_number}
                      </a>
                    </>
                  )}
                </p>
                <p className="text-xs text-slate-500">{[c?.full_name, c?.phone, c?.business_email].filter(Boolean).join(" · ")}</p>
                <h2 className="mt-3 font-semibold">{job.title}</h2>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{ru.summary}</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <form action={approveCompanyJob}>
                    <input type="hidden" name="id" value={job.id} />
                    <SubmitButton className="w-full rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60 sm:w-auto">
                      Опубликовать
                    </SubmitButton>
                  </form>
                  <form action={rejectCompanyJob} className="flex flex-1 gap-2">
                    <input type="hidden" name="id" value={job.id} />
                    <input name="reason" placeholder="Причина (видна компании)" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <SubmitButton className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-60">
                      Отклонить
                    </SubmitButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
