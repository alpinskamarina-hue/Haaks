import { redirect } from "next/navigation";
import { approveCompanyJob, checkCompanyKvk, rejectCompanyJob, resolveReport } from "@/app/company-actions";
import { REASON_RU } from "@/lib/report-i18n";
import { SubmitButton } from "@/components/SubmitButton";
import { dayMonthYear, jobTexts, type CompanyInfo, type CompanyJob } from "@/lib/company-jobs";
import { kvkSearchUrl } from "@/lib/documents";
import { createServerAccountClient } from "@/lib/supabase/server";
import { loadWorkspace } from "@/lib/workspace";
import { resolveReviewReport } from "@/app/reviews-actions";
import { ReviewCard } from "@/components/ReviewCard";
import type { Review } from "@/lib/reviews";
import { getReviewsDict } from "@/lib/reviews-i18n";

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

  // Complaints, grouped by what they are about.
  const { data: reportRows } = await server
    .from("reports")
    .select("target_kind, target_id, reason, created_at")
    .order("created_at", { ascending: false })
    .returns<{ target_kind: "job" | "worker"; target_id: string; reason: keyof typeof REASON_RU; created_at: string }[]>();
  const groups = new Map<string, { kind: "job" | "worker"; target: string; reasons: (keyof typeof REASON_RU)[] }>();
  for (const r of reportRows ?? []) {
    const key = `${r.target_kind}:${r.target_id}`;
    const g = groups.get(key) ?? { kind: r.target_kind, target: r.target_id, reasons: [] };
    g.reasons.push(r.reason);
    groups.set(key, g);
  }
  const reported = [...groups.values()];
  const jobItems = reported.filter((g) => g.kind === "job").map((g) => g.target);
  const workerIds = reported.filter((g) => g.kind === "worker").map((g) => g.target);
  const [{ data: reportedJobs }, { data: reportedWorkers }] = await Promise.all([
    jobItems.length
      ? server.from("company_jobs").select("feed_item_id, title, city, company_id").in("feed_item_id", jobItems)
      : Promise.resolve({ data: [] as { feed_item_id: string; title: string; city: string; company_id: string }[] }),
    workerIds.length
      ? server.from("profiles").select("id, full_name, city, trades").in("id", workerIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; city: string | null; trades: string[] }[] }),
  ]);
  // Reviews a builder reported.
  const { data: reviewReports } = await server
    .from("reviews")
    .select("*")
    .eq("status", "submitted")
    .not("report_reason", "is", null)
    .order("reported_at", { ascending: true })
    .returns<Review[]>();
  const reviewWorkerIds = [...new Set((reviewReports ?? []).map((r) => r.worker_id))];
  const { data: reviewWorkers } = reviewWorkerIds.length
    ? await server.from("profiles").select("id, full_name").in("id", reviewWorkerIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const reviewWorkerName = new Map((reviewWorkers ?? []).map((w) => [w.id as string, w.full_name as string | null]));
  const rvRu = getReviewsDict("ru");

  // KvK check (research item 5): all companies with a KvK number, unchecked first.
  const { data: kvkCompanies } = await server
    .from("profiles")
    .select("id, company_name, kvk_number, full_name, kvk_checked_at, kvk_checked_name")
    .eq("account_type", "company")
    .not("kvk_number", "is", null)
    .order("kvk_checked_at", { ascending: false, nullsFirst: true })
    .returns<{ id: string; company_name: string | null; kvk_number: string; full_name: string | null; kvk_checked_at: string | null; kvk_checked_name: string | null }[]>();
  const kvkList = kvkCompanies ?? [];
  const kvkOpen = kvkList.filter((c) => !c.kvk_checked_at).length;

  const jobByItem = new Map((reportedJobs ?? []).map((j) => [j.feed_item_id as string, j]));
  const workerById = new Map((reportedWorkers ?? []).map((w) => [w.id as string, w]));

  return (
    <main className="mx-auto max-w-3xl space-y-5 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Модерация</h1>
        <p className="mt-1 text-slate-600">
          Первые заказы компании или строителя («Нужен помощник») ждут вашей проверки. После первого одобренного заказа автор считается
          проверенным, и его следующие заказы сразу попадают в ленту.
        </p>
      </div>
      {ok && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          {ok === "published"
            ? "Опубликовано: заказ в ленте «Компании ищут», подходящим строителям ушли уведомления."
            : ok === "removed"
              ? "Снято: заказ убран из ленты (или строитель убран из каталога), жалобы закрыты."
              : ok === "review_removed"
                ? "Отзыв удалён: его больше нет в паспорте и в оценке."
              : ok === "review_kept"
                ? "Отзыв оставлен и показан в паспорте. Повторно пожаловаться на него строитель не сможет."
              : ok === "kvk_checked"
                ? "KvK отмечен как проверенный: строители видят «KvK проверен» у заказов этой компании."
              : ok === "kvk_unchecked"
                ? "Отметка «KvK проверен» снята."
              : ok === "kvk_name"
                ? "Впишите название компании так, как оно указано на kvk.nl."
              : ok === "dismissed"
                ? "Жалобы отклонены, всё осталось как было."
                : "Заказ отклонён."}
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

      <h2 id="kvk" className="pt-4 text-xl font-bold">
        Проверка KvK компаний {kvkOpen > 0 && <span className="text-red-600">({kvkOpen})</span>}
      </h2>
      <p className="text-sm text-slate-600">
        Откройте номер на kvk.nl и сравните название. Если совпадает, впишите название как в реестре и нажмите «KvK проверен». Строители
        увидят зелёный значок у заказов компании. Если компания поменяет номер KvK, отметка снимется сама.
      </p>
      {kvkList.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-center text-slate-500">Компаний пока нет.</p>
      ) : (
        <ul className="space-y-3">
          {kvkList.map((c) => (
            <li key={c.id} className={`rounded-xl border p-4 ${c.kvk_checked_at ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"}`}>
              <p className="text-sm">
                <span className="font-semibold">{c.company_name ?? "—"}</span> · KvK{" "}
                <a href={kvkSearchUrl(c.kvk_number)} target="_blank" rel="noopener" className="text-blue-700 underline">
                  {c.kvk_number} ↗
                </a>
                {c.full_name ? <span className="text-slate-500"> · {c.full_name}</span> : null}
              </p>
              {c.kvk_checked_at ? (
                <form action={checkCompanyKvk} className="mt-2 flex flex-wrap items-center gap-2 text-sm text-green-800">
                  <span>
                    ✓ Проверен {dayMonthYear(c.kvk_checked_at.slice(0, 10))}: «{c.kvk_checked_name}»
                  </span>
                  <input type="hidden" name="company" value={c.id} />
                  <input type="hidden" name="ok" value="0" />
                  <SubmitButton className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 disabled:opacity-60">Снять</SubmitButton>
                </form>
              ) : (
                <form action={checkCompanyKvk} className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="company" value={c.id} />
                  <input type="hidden" name="ok" value="1" />
                  <input
                    name="name"
                    defaultValue={c.company_name ?? ""}
                    required
                    placeholder="Название как на kvk.nl"
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <SubmitButton className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">✓ KvK проверен</SubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="pt-4 text-xl font-bold">Жалобы {reported.length > 0 && <span className="text-red-600">({reported.length})</span>}</h2>
      {reported.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-center text-slate-500">Жалоб нет.</p>
      ) : (
        <ul className="space-y-4">
          {reported.map((g) => {
            const job = g.kind === "job" ? jobByItem.get(g.target) : null;
            const worker = g.kind === "worker" ? workerById.get(g.target) : null;
            const counts = Object.entries(
              g.reasons.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r]: (acc[r] ?? 0) + 1 }), {}),
            );
            return (
              <li key={`${g.kind}:${g.target}`} className="rounded-xl border border-red-200 bg-white p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase text-red-700">
                  ⚠️ {g.kind === "job" ? "Жалоба на заказ" : "Жалоба на строителя в каталоге"} · {g.reasons.length}
                </p>
                <h3 className="mt-1 font-semibold">
                  {g.kind === "job" ? `${job?.title ?? "Заказ уже удалён"}${job?.city ? `, ${job.city}` : ""}` : (worker?.full_name ?? "Профиль удалён")}
                </h3>
                {worker && <p className="text-sm text-slate-500">{[worker.city, worker.trades?.join(", ")].filter(Boolean).join(" · ")}</p>}
                <ul className="mt-2 space-y-0.5 text-sm text-slate-700">
                  {counts.map(([r, n]) => (
                    <li key={r}>
                      • {REASON_RU[r as keyof typeof REASON_RU] ?? r}
                      {n > 1 ? ` ×${n}` : ""}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={resolveReport}>
                    <input type="hidden" name="kind" value={g.kind} />
                    <input type="hidden" name="target" value={g.target} />
                    <input type="hidden" name="remove" value="1" />
                    <SubmitButton className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                      {g.kind === "job" ? "Снять с ленты" : "Убрать из каталога"}
                    </SubmitButton>
                  </form>
                  <form action={resolveReport}>
                    <input type="hidden" name="kind" value={g.kind} />
                    <input type="hidden" name="target" value={g.target} />
                    <SubmitButton className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60">
                      Жалоба не подтвердилась
                    </SubmitButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <h2 className="pt-4 text-xl font-bold">
        Жалобы на отзывы {(reviewReports ?? []).length > 0 && <span className="text-red-600">({(reviewReports ?? []).length})</span>}
      </h2>
      {(reviewReports ?? []).length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-center text-slate-500">Жалоб на отзывы нет.</p>
      ) : (
        <ul className="space-y-4">
          {(reviewReports ?? []).map((r) => (
            <li key={r.id} className="space-y-3 rounded-xl border border-red-200 bg-white p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase text-red-700">
                ⚠️ Строитель {reviewWorkerName.get(r.worker_id) ?? "—"} жалуется: {r.report_reason ? rvRu.reasons[r.report_reason] : ""}
                {r.held ? " · отзыв скрыт до решения" : " · отзыв уже виден"}
              </p>
              {r.report_note && <p className="text-sm text-slate-700">«{r.report_note}»</p>}
              <ReviewCard review={r} lang="ru" criteria={rvRu.criteria} replyLabel={rvRu.yourReply} />
              <div className="flex flex-wrap gap-2">
                <form action={resolveReviewReport}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="remove" value="1" />
                  <SubmitButton className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Удалить отзыв</SubmitButton>
                </form>
                <form action={resolveReviewReport}>
                  <input type="hidden" name="id" value={r.id} />
                  <SubmitButton className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-60">Оставить отзыв</SubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
