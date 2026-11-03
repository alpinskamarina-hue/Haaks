import Link from "next/link";
import { decideJobReply } from "@/app/company-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { type CompanyDict, type CompanyLang } from "@/lib/company-i18n";
import { dayMonthYear, type CompanyJob } from "@/lib/company-jobs";
import { kvkSearchUrl } from "@/lib/documents";
import { tradeLabel } from "@/lib/feed";
import { LANG_NAMES, isLang } from "@/lib/i18n";
import type { CompanyReply } from "@/lib/job-replies";

const card = "rounded-xl border border-slate-200 bg-white p-4 sm:p-5";
const badge = { sent: "bg-orange-100 text-orange-800", accepted: "bg-green-100 text-green-800", declined: "bg-slate-100 text-slate-500" };

// One company job with the builders who replied to it.
export function CompanyReplies({
  job,
  replies,
  t,
  lang,
  ok,
}: {
  job: Pick<CompanyJob, "id" | "title" | "city" | "trades">;
  replies: CompanyReply[];
  t: CompanyDict;
  lang: CompanyLang;
  ok?: string;
}) {
  return (
    <div className="space-y-5">
      <Link href="/company" className="text-sm text-slate-500">
        {t.back}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {job.trades.map((tr) => tradeLabel(tr, lang)).join(", ")} · {job.city}
        </p>
      </div>
      {ok && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{ok === "accepted" ? t.acceptedMsg : t.declinedMsg}</p>}
      <div>
        <h2 className="text-lg font-semibold">{t.repliesTitle}</h2>
        <p className="text-sm text-slate-600">{t.repliesIntro}</p>
      </div>
      {replies.length === 0 ? (
        <p className={`${card} text-center text-slate-500`}>{t.noReplies}</p>
      ) : (
        <ul className="space-y-3">
          {replies.map((r) => (
            <li key={r.id} className={`${card} ${r.status === "declined" ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{r.full_name || "ZZP vakman"}</p>
                  <p className="text-sm text-slate-600">
                    {[r.trades.map((tr) => tradeLabel(tr, lang)).join(", "), r.city].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge[r.status]}`}>{t.replyStatus[r.status]}</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {r.hourly_rate && (
                  <>
                    <dt className="text-slate-500">{t.hourRate}</dt>
                    <dd>€{r.hourly_rate}</dd>
                  </>
                )}
                {r.languages.length > 0 && (
                  <>
                    <dt className="text-slate-500">{t.languages}</dt>
                    <dd>{r.languages.map((l) => (isLang(l) ? LANG_NAMES[l] : l)).join(", ")}</dd>
                  </>
                )}
                {r.vehicle && (
                  <>
                    <dt className="text-slate-500">{t.vehicle}</dt>
                    <dd>{t.vehicles[r.vehicle as keyof CompanyDict["vehicles"]] ?? r.vehicle}</dd>
                  </>
                )}
                {r.tools && (
                  <>
                    <dt className="text-slate-500">{t.toolsLabel}</dt>
                    <dd>{t.toolsKinds[r.tools as keyof CompanyDict["toolsKinds"]] ?? r.tools}</dd>
                  </>
                )}
                {r.kvk_number && (
                  <>
                    <dt className="text-slate-500">KvK</dt>
                    <dd>
                      <a href={kvkSearchUrl(r.kvk_number)} target="_blank" rel="noopener" className="text-blue-700 underline">
                        {r.kvk_number}
                      </a>
                    </dd>
                  </>
                )}
              </dl>
              {r.passport_token && (
                <a href={`/p/${r.passport_token}`} target="_blank" rel="noopener" className="mt-3 inline-block text-sm font-medium text-orange-700 underline">
                  🪪 {t.passport}
                </a>
              )}
              {r.status === "accepted" && (r.phone || r.email) && (
                <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm">
                  <p className="font-semibold text-green-900">{t.contactsOpen}</p>
                  {r.phone && (
                    <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="block text-green-900 underline">
                      📞 {r.phone}
                    </a>
                  )}
                  {r.email && (
                    <a href={`mailto:${r.email}`} className="block break-all text-green-900 underline">
                      ✉️ {r.email}
                    </a>
                  )}
                </div>
              )}
              {r.status === "sent" && (
                <form action={decideJobReply} className="mt-3 flex gap-2">
                  <input type="hidden" name="reply" value={r.id} />
                  <input type="hidden" name="job" value={job.id} />
                  <input type="hidden" name="accept" value="1" />
                  <SubmitButton className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">
                    {t.accept}
                  </SubmitButton>
                </form>
              )}
              {r.status === "sent" && (
                <form action={decideJobReply} className="mt-2">
                  <input type="hidden" name="reply" value={r.id} />
                  <input type="hidden" name="job" value={job.id} />
                  <input type="hidden" name="accept" value="0" />
                  <SubmitButton className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 disabled:opacity-60">{t.decline}</SubmitButton>
                </form>
              )}
              <p className="mt-2 text-xs text-slate-400">{dayMonthYear(r.created_at.slice(0, 10))}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-500">{t.contactNote}</p>
    </div>
  );
}
