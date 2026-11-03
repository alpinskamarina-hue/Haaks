import Link from "next/link";
import { inviteWorker } from "@/app/company-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { fill, type CompanyDict, type CompanyLang } from "@/lib/company-i18n";
import { dayMonthYear, JOB_TRADES } from "@/lib/company-jobs";
import { tradeLabel } from "@/lib/feed";
import { isLang, LANG_NAMES } from "@/lib/i18n";

export type CatalogWorker = {
  id: string;
  name: string | null;
  city: string | null;
  travel_km: number | null;
  trades: string[];
  languages: string[];
  hourly_rate: number | null;
  vehicle: string | null;
  tools: string | null;
  available: boolean;
  available_from: string | null;
  has_kvk: boolean;
  passport_token: string | null;
  invite_status: "sent" | "accepted" | "declined" | null;
};

export type SentInvite = {
  id: string;
  worker_id: string;
  status: "sent" | "accepted" | "declined";
  full_name: string | null;
  trades: string[];
  city: string | null;
  job_title: string | null;
  phone: string | null;
  email: string | null;
};

const card = "rounded-xl border border-slate-200 bg-white p-4";

// Builders who chose "Looking for work", for companies; invite one to open contacts.
export function CompanyCatalog({
  workers,
  invites,
  jobs,
  trade,
  t,
  lang,
  ok,
  error,
}: {
  workers: CatalogWorker[];
  invites: SentInvite[];
  jobs: { id: string; title: string }[];
  trade: string | null;
  t: CompanyDict;
  lang: CompanyLang;
  ok?: string;
  error?: string;
}) {
  const shown = trade ? workers.filter((w) => w.trades.includes(trade)) : workers;
  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-sm ${active ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-700"}`;
  const accepted = invites.filter((i) => i.status === "accepted");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t.buildersTitle}</h1>
        <p className="mt-1 text-slate-600">{t.buildersIntro}</p>
      </div>
      {ok === "invited" && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{t.invitedMsg}</p>}
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{t.errors[error as keyof CompanyDict["errors"]] ?? t.errors.failed}</p>
      )}

      {accepted.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">✓ {t.inviteAccepted}</h2>
          {accepted.map((i) => (
            <div key={i.id} className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm">
              <p className="font-semibold text-green-900">
                {i.full_name} · {i.trades.map((tr) => tradeLabel(tr, lang)).join(", ")}
              </p>
              {i.phone && (
                <a href={`tel:${i.phone.replace(/\s/g, "")}`} className="block text-green-900 underline">
                  📞 {i.phone}
                </a>
              )}
              {i.email && (
                <a href={`mailto:${i.email}`} className="block break-all text-green-900 underline">
                  ✉️ {i.email}
                </a>
              )}
            </div>
          ))}
        </section>
      )}

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href="/company/builders" className={chip(!trade)}>
          {t.allTrades} ({workers.length})
        </Link>
        {JOB_TRADES.map((key) => {
          const n = workers.filter((w) => w.trades.includes(key)).length;
          return n ? (
            <Link key={key} href={`/company/builders?trade=${key}`} className={chip(trade === key)}>
              {tradeLabel(key, lang)} ({n})
            </Link>
          ) : null;
        })}
      </div>

      {shown.length === 0 ? (
        <p className={`${card} text-center text-slate-500`}>{t.noBuilders}</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((w) => (
            <li key={w.id} className={card}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{w.name ?? "ZZP"}</p>
                  <p className="text-sm text-slate-600">{w.trades.map((tr) => tradeLabel(tr, lang)).join(", ")}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${w.available ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}
                >
                  {w.available ? t.availableNow : w.available_from ? fill(t.availableFrom, { d: dayMonthYear(w.available_from) }) : "—"}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                📍 {[w.city, w.travel_km === 0 ? t.wholeCountry : w.travel_km ? fill(t.travel, { n: w.travel_km }) : null].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600">
                {w.hourly_rate && <span>€{w.hourly_rate}/h</span>}
                {w.languages.length > 0 && <span>🗣 {w.languages.map((l) => (isLang(l) ? LANG_NAMES[l] : l)).join(", ")}</span>}
                {w.vehicle && w.vehicle !== "none" && <span>🚐 {t.vehicles[w.vehicle as keyof CompanyDict["vehicles"]]}</span>}
                {w.tools && w.tools !== "none" && <span>🧰 {t.toolsKinds[w.tools as keyof CompanyDict["toolsKinds"]]}</span>}
                {w.has_kvk && <span className="text-green-700">{t.kvkYes}</span>}
              </p>
              {w.passport_token && (
                <a href={`/p/${w.passport_token}`} target="_blank" rel="noopener" className="mt-2 inline-block text-sm font-medium text-orange-700 underline">
                  🪪 {t.passport}
                </a>
              )}
              {w.invite_status ? (
                <p
                  className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${
                    w.invite_status === "accepted" ? "bg-green-50 text-green-800" : w.invite_status === "declined" ? "bg-slate-100 text-slate-500" : "bg-purple-50 text-purple-800"
                  }`}
                >
                  {w.invite_status === "accepted" ? `✓ ${t.inviteAccepted}` : w.invite_status === "declined" ? t.inviteDeclined : `⏳ ${t.inviteSent}`}
                </p>
              ) : (
                <form action={inviteWorker} className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="worker" value={w.id} />
                  {trade && <input type="hidden" name="trade" value={trade} />}
                  {jobs.length > 0 && (
                    <select name="job" aria-label={t.inviteFor} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                      <option value="">{t.noJobOption}</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {t.inviteFor}: {j.title}
                        </option>
                      ))}
                    </select>
                  )}
                  <SubmitButton className="rounded-lg bg-orange-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">{t.inviteBtn}</SubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-500">{fill(t.inviteLimit, { n: 10 })}</p>
    </div>
  );
}
