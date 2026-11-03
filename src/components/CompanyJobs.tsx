import Link from "next/link";
import { closeCompanyJob, saveCompanyDetails } from "@/app/company-actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { SubmitButton } from "@/components/SubmitButton";
import { fill, type CompanyDict } from "@/lib/company-i18n";
import { dayMonthYear, FREE_ACTIVE_JOBS, requirementLabel, type CompanyInfo, type CompanyJob } from "@/lib/company-jobs";
import { tradeLabel } from "@/lib/feed";

const input = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base";
export const companyCard = "rounded-xl border border-slate-200 bg-white p-4 sm:p-5";
const card = companyCard;

const badge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  published: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  closed: "bg-slate-100 text-slate-600",
  expired: "bg-slate-100 text-slate-600",
};

export function CompanyNotice({ t, ok, error }: { t: CompanyDict; ok?: string; error?: string }) {
  const okText = ok === "sent" ? t.sentForCheck : ok === "published" ? t.published : ok === "closed" ? t.closed : ok === "saved" ? t.saved : null;
  const errText = error ? fill(t.errors[error as keyof CompanyDict["errors"]] ?? t.errors.failed, { max: FREE_ACTIVE_JOBS }) : null;
  if (okText) return <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{okText}</p>;
  if (errText) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{errText}</p>;
  return null;
}

export function CompanyDetailsForm({ t, profile, email }: { t: CompanyDict; profile: CompanyInfo | null; email: string }) {
  return (
    <form action={saveCompanyDetails} className={`${card} space-y-3`}>
      <h2 className="text-lg font-semibold">{t.detailsTitle}</h2>
      <p className="text-sm text-slate-600">{t.detailsText}</p>
      <label className="block text-sm font-medium">
        {t.companyName}
        <input name="company_name" required defaultValue={profile?.company_name ?? ""} className={input} />
      </label>
      <label className="block text-sm font-medium">
        {t.kvk}
        <input name="kvk_number" required inputMode="numeric" pattern="\s*\d{8}\s*" defaultValue={profile?.kvk_number ?? ""} className={input} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {t.contactName}
          <input name="full_name" required defaultValue={profile?.full_name ?? ""} className={input} />
        </label>
        <label className="block text-sm font-medium">
          {t.phone}
          <input name="phone" type="tel" required defaultValue={profile?.phone ?? ""} className={input} />
        </label>
      </div>
      <label className="block text-sm font-medium">
        {t.email}
        <input name="business_email" type="email" defaultValue={profile?.business_email ?? email} className={input} />
      </label>
      <SubmitButton className="w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60">{t.save}</SubmitButton>
    </form>
  );
}

export function CompanyJobRow({
  job,
  t,
  lang,
  replies,
}: {
  job: CompanyJob;
  t: CompanyDict;
  lang: "nl" | "en";
  replies?: { total: number; fresh: number };
}) {
  const expired = job.status === "published" && job.expires_at && Date.parse(job.expires_at) <= Date.now();
  const status = expired ? "expired" : job.status;
  const pay =
    job.rate_type === "ask" || !job.rate ? t.rateAsk : `€${job.rate} ${job.rate_type === "hour" ? `· ${t.rateHour.toLowerCase()}` : `· ${t.rateFixed.toLowerCase()}`}`;
  return (
    <li className={card}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 font-semibold">{job.title}</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge[status]}`}>{t.status[status]}</span>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        {job.trades.map((tr) => tradeLabel(tr, lang)).join(", ")} · {job.city}
        {job.people > 1 ? ` · ×${job.people}` : ""}
        {job.start_date ? ` · ${dayMonthYear(job.start_date)}` : ""} · {pay}
      </p>
      {job.requirements.length > 0 && <p className="mt-1 text-xs text-slate-500">{job.requirements.map((r) => requirementLabel(r, lang)).join(" · ")}</p>}
      {status === "published" && job.expires_at && (
        <p className="mt-2 text-xs text-slate-500">{fill(t.onlineUntil, { d: dayMonthYear(job.expires_at.slice(0, 10)) })}</p>
      )}
      {status === "rejected" && job.reject_reason && <p className="mt-2 text-sm text-red-700">{fill(t.rejectedBecause, { r: job.reject_reason })}</p>}
      {job.status !== "pending" && job.status !== "rejected" && (
        <Link
          href={`/company/jobs/${job.id}`}
          className={`mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
            replies?.total ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          👷 {replies?.total ? fill(t.replies, { n: replies.total }) : t.repliesNone}
          {!!replies?.fresh && <span className="rounded-full bg-white px-1.5 text-xs text-orange-700">+{replies.fresh}</span>}
        </Link>
      )}
      {(status === "pending" || status === "published") && (
        <form action={closeCompanyJob} className="mt-3">
          <input type="hidden" name="id" value={job.id} />
          <ConfirmButton message={t.closeConfirm} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
            {t.close}
          </ConfirmButton>
        </form>
      )}
    </li>
  );
}
