import Link from "next/link";
import { createCompanyJob } from "@/app/company-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { fill, type CompanyDict, type CompanyLang } from "@/lib/company-i18n";
import { FREE_ACTIVE_JOBS, JOB_REQUIREMENTS, JOB_TRADES, requirementLabel } from "@/lib/company-jobs";
import { tradeLabel } from "@/lib/feed";

const input = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base";
const chip =
  "flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50";

// The form a company fills in for a new job.
export function CompanyJobForm({ t, lang, error }: { t: CompanyDict; lang: CompanyLang; error?: string }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={createCompanyJob} className="space-y-5">
      <h1 className="text-2xl font-bold">{t.formTitle}</h1>
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {fill(t.errors[error as keyof CompanyDict["errors"]] ?? t.errors.failed, { max: FREE_ACTIVE_JOBS })}
        </p>
      )}

      <label className="block text-sm font-medium">
        {t.jobTitle}
        <input name="title" required minLength={3} maxLength={120} placeholder={t.jobTitleHint} className={input} />
      </label>

      <fieldset>
        <legend className="text-sm font-medium">{t.trades}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {JOB_TRADES.map((key) => (
            <label key={key} className={chip}>
              <input type="checkbox" name="trades" value={key} className="accent-orange-600" />
              {tradeLabel(key, lang)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {t.city}
          <input name="city" required maxLength={80} className={input} />
        </label>
        <label className="block text-sm font-medium">
          {t.postcode}
          <input name="postcode" maxLength={7} placeholder="3011 AB" className={input} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="col-span-2 block text-sm font-medium sm:col-span-1">
          {t.startDate}
          <input name="start_date" type="date" min={today} className={input} />
        </label>
        <label className="block text-sm font-medium">
          {t.weeks}
          <input name="weeks" type="number" min={1} max={104} inputMode="numeric" className={input} />
        </label>
        <label className="block text-sm font-medium">
          {t.people}
          <input name="people" type="number" min={1} max={50} defaultValue={1} inputMode="numeric" className={input} />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">{t.rate}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["hour", "fixed", "ask"] as const).map((key) => (
            <label key={key} className={chip}>
              <input type="radio" name="rate_type" value={key} defaultChecked={key === "hour"} className="accent-orange-600" />
              {key === "hour" ? t.rateHour : key === "fixed" ? t.rateFixed : t.rateAsk}
            </label>
          ))}
        </div>
        <label className="mt-2 block text-sm">
          {t.rateAmount}
          <input name="rate" inputMode="decimal" placeholder="45" className={`${input} max-w-40`} />
        </label>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">{t.requirements}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {JOB_REQUIREMENTS.map((key) => (
            <label key={key} className={chip}>
              <input type="checkbox" name="requirements" value={key} className="accent-orange-600" />
              {requirementLabel(key, lang)}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-medium">
        {t.description}
        <textarea name="description" rows={5} maxLength={2000} className={input} />
        <span className="mt-1 block text-xs font-normal text-slate-500">{t.descriptionHint}</span>
      </label>

      <label className="flex items-start gap-3 rounded-lg bg-slate-100 p-3 text-sm">
        <input type="checkbox" name="opdracht" required className="mt-1 accent-orange-600" />
        <span>{t.opdracht}</span>
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <SubmitButton className="rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white disabled:opacity-60">{t.publish}</SubmitButton>
        <Link href="/company" className="rounded-lg px-5 py-3 text-center text-slate-600">
          {t.cancel}
        </Link>
      </div>
    </form>
  );
}
