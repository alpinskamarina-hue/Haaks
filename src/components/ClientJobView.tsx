import Link from "next/link";
import { chooseBuilder, closeClientRequest } from "@/app/client-request-actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CopyButton } from "@/components/CopyButton";
import { HtmlLang } from "@/components/HtmlLang";
import { PublicFooter } from "@/components/PublicFooter";
import { getClientDict, PHRASES, type Phrase } from "@/lib/client-request-i18n";
import { MAX_REPLIES, workType, type ClientRequest } from "@/lib/client-requests";
import { distanceKm } from "@/lib/feed";
import { fill } from "@/lib/feed-i18n";
import { ratingText } from "@/lib/reviews";
import { getWorkerDict } from "@/lib/worker-profile-text";

export type Reply = {
  id: string;
  status: "sent" | "chosen" | "not_chosen";
  phrases: string[];
  message: string | null;
  created_at: string;
  worker_id: string;
  full_name: string | null;
  avatar_path: string | null;
  trades: string[] | null;
  city: string | null;
  home_lat: number | null;
  home_lng: number | null;
  username: string | null;
  passport_token: string | null;
  has_kvk: boolean;
  avg_stars: number | null;
  reviews: number;
  works: number;
  phone: string | null;
  email: string | null;
};

// "Andrzej Kowalski" -> "Andrzej K."
const shortName = (name: string | null) => {
  const [first, ...rest] = (name ?? "").trim().split(/\s+/);
  return [first, rest.length ? `${rest[rest.length - 1][0]}.` : ""].filter(Boolean).join(" ") || "Vakman";
};

// The client's own page of a job: status, the builders' replies, choosing one (see src/app/klus/[token]).
export function ClientJobView({
  req,
  replies,
  url,
  validDocs,
  site,
  token,
  isNew,
}: {
  req: ClientRequest;
  replies: Reply[];
  url: Map<string, string>;
  validDocs: Set<string>;
  site: string;
  token: string;
  isNew: boolean;
}) {
  const lang = req.lang;
  const t = getClientDict(lang);
  const trades = getWorkerDict(lang).trades as Record<string, string>;
  const link = `${site}/klus/${token}`;
  const open = req.status === "pending" || req.status === "published";
  const chosen = replies.find((r) => r.status === "chosen");
  const status =
    req.status === "pending" ? t.statusPending : req.status === "published" ? t.statusPublished : req.status === "rejected" ? t.statusRejected : t.statusClosed;
  const type = workType(req.work_type);

  return (
    <main className="min-h-screen bg-slate-50">
      <HtmlLang lang={lang} />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/vakman-gezocht" className="grid h-9 w-9 place-items-center rounded-xl bg-orange-600 font-bold text-white">H</Link>
          <span className="font-semibold">
            {t.yourJob} · {type?.[lang] ?? req.work_type}
          </span>
        </div>
      </header>
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {(isNew || open) && !chosen && (
          <section className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="font-semibold">🔖 {t.saveLink}</p>
            <p className="mt-1 text-sm text-orange-900">{t.saveLinkHint}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton value={link} label={t.copy} />
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${t.yourJob}: ${link}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-green-600 bg-white px-3 py-2 text-sm font-semibold text-green-700"
              >
                {t.toWhatsapp}
              </a>
            </div>
          </section>
        )}

        <section className={`rounded-2xl border p-4 ${req.status === "published" ? "border-green-200 bg-green-50 text-green-900" : "border-slate-200 bg-white"}`}>
          <p className="font-medium">{req.status === "published" ? "✓ " : ""}{status}</p>
          {req.status === "rejected" && req.reject_reason && <p className="mt-1 text-sm">{req.reject_reason}</p>}
          <p className="mt-2 text-sm text-slate-600">
            {req.postcode} {req.city ? `· ${req.city}` : ""} · {t.timing[req.timing]}
            {req.size ? ` · ${req.size}` : ""}
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{req.description}</p>
          {req.photos.length > 0 && (
            <div className="mt-2 flex gap-2">
              {req.photos.map((p) =>
                url.get(p) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p} src={url.get(p) ?? undefined} alt="" className="h-16 w-16 rounded-lg object-cover" />
                ) : null,
              )}
            </div>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">{t.repliesTitle}</h2>
            <span className="text-sm text-slate-500">{fill(t.replyCount, { n: replies.length, max: MAX_REPLIES })}</span>
          </div>
          {replies.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">{t.noReplies}</p>}
          <ul className="space-y-3">
            {replies.map((r) => {
              const km = distanceKm({ lat: req.lat, lng: req.lng }, { lat: r.home_lat, lng: r.home_lng });
              const avatar = r.avatar_path ? url.get(r.avatar_path) : null;
              const badges = [
                r.has_kvk ? t.badges.kvk : null,
                validDocs.has(`${r.worker_id}:vca`) ? t.badges.vca : null,
                validDocs.has(`${r.worker_id}:avb`) ? t.badges.avb : null,
                r.passport_token ? t.badges.passport : null,
              ].filter(Boolean);
              const profile = r.username ? `${site}/@${r.username}` : r.passport_token ? `${site}/p/${r.passport_token}` : null;
              return (
                <li
                  key={r.id}
                  className={`rounded-2xl border bg-white p-4 shadow-sm ${r.status === "chosen" ? "border-2 border-green-600" : r.status === "not_chosen" ? "border-slate-200 opacity-60" : "border-slate-200"}`}
                >
                  <div className="flex gap-3">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-orange-200 font-bold text-orange-900">
                        {(r.full_name ?? "?").trim()[0]?.toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {shortName(r.full_name)}
                        {r.trades?.length ? <span className="font-normal text-slate-600"> · {r.trades.map((k) => trades[k] ?? k).join(", ")}</span> : null}
                      </p>
                      <p className="text-sm text-slate-600">
                        {r.reviews > 0 && r.avg_stars ? (
                          <span className="text-amber-500">★ {ratingText(Number(r.avg_stars))} </span>
                        ) : null}
                        {[r.reviews > 0 ? fill(t.reviews, { n: r.reviews }) : null, km != null ? `📍 ${fill(t.kmAway, { n: Math.max(1, Math.round(km)) })}` : null, r.works > 0 ? fill(t.works, { n: r.works }) : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                  {badges.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {badges.map((b) => (
                        <span key={b} className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">✓ {b}</span>
                      ))}
                    </div>
                  )}
                  <ul className="mt-2 space-y-0.5 text-sm text-slate-800">
                    {r.phrases.filter((p): p is Phrase => (PHRASES as readonly string[]).includes(p)).map((p) => (
                      <li key={p}>• {t.phrases[p]}</li>
                    ))}
                  </ul>
                  {r.message && <p className="mt-2 whitespace-pre-line rounded-xl bg-slate-50 px-3 py-2 text-sm">«{r.message}»</p>}
                  {r.status === "chosen" ? (
                    <div className="mt-3 rounded-xl bg-green-50 p-3">
                      <p className="font-semibold text-green-800">✓ {t.chosen}</p>
                      <p className="text-sm text-green-900">{t.chosenHint}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.phone && (
                          <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="rounded-xl bg-green-600 px-4 py-2 font-semibold text-white">
                            📞 {t.call} {r.phone}
                          </a>
                        )}
                        {r.email && (
                          <a href={`mailto:${r.email}`} className="rounded-xl border border-green-600 bg-white px-4 py-2 font-semibold text-green-700">
                            ✉️ {t.mail}
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      {open && !chosen && (
                        <form action={chooseBuilder.bind(null, token, r.id)} className="flex-1">
                          <ConfirmButton message={t.contactConfirm} className="w-full rounded-xl bg-orange-600 px-4 py-2.5 font-semibold text-white">
                            {t.contact}
                          </ConfirmButton>
                        </form>
                      )}
                      {profile && (
                        <a href={profile} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-300 px-4 py-2.5 text-center font-semibold">
                          {t.profile}
                        </a>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {open && !chosen && (
          <form action={closeClientRequest.bind(null, token)} className="text-center">
            <ConfirmButton message={t.stopConfirm} className="text-sm text-slate-500 underline">
              {t.stop}
            </ConfirmButton>
          </form>
        )}
        <p className="text-center text-xs text-slate-500">{t.footer}</p>
        <PublicFooter />
      </div>
    </main>
  );
}
