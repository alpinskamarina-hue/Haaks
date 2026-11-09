import Link from "next/link";
import { FeedSourceInfo } from "@/components/FeedSourceInfo";
import { loadNearFirms, mapsLink } from "@/lib/firms";
import { getFirmAboutDict } from "@/lib/firm-about-i18n";
import { waNumber } from "@/lib/firm-offer";
import { getFirmOfferDict } from "@/lib/firm-offer-i18n";
import { FirmOfferState } from "@/components/FirmOfferState";
import { getFirmsDict } from "@/lib/firms-i18n";
import { fill } from "@/lib/feed-i18n";
import { loadWorkspace } from "@/lib/workspace";

const button =
  "rounded-lg border border-purple-300 px-3 py-1.5 text-sm font-semibold text-purple-800";

// «Фирмы рядом»: construction firms near the builder, nearest first.
export default async function FirmsPage() {
  const { supabase, profile, lang } = await loadWorkspace();
  const t = getFirmsDict(lang);
  const o = getFirmOfferDict(lang);
  const a = getFirmAboutDict(lang);
  const { firms, offers, known } = await loadNearFirms(supabase, profile);
  const dateFmt = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : lang, { day: "numeric", month: "short" });

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <Link href="/dashboard/leads/feed" className="text-sm text-slate-500">
        {t.back}
      </Link>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          {t.title}
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800">
            {t.test}
          </span>
        </h1>
        <FeedSourceInfo source="firms" lang={lang} text={o.hint} className="mt-2" />
        {!known && (
          <p className="mt-2 text-sm text-slate-500">{t.noHome}</p>
        )}
      </div>
      {!firms.length && (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">
          {t.empty}
        </p>
      )}
      <ul className="space-y-3">
        {firms.map((f) => (
          <li
            key={f.id}
            className="rounded-2xl border border-l-4 border-slate-200 border-l-purple-600 bg-white p-4 shadow-sm"
          >
            <p className="font-semibold">{f.name}</p>
            <p className="mt-0.5 text-sm text-slate-600">
              {[
                f.km != null
                  ? `📍 ${fill(t.kmAway, { n: String(Math.round(f.km)) })}`
                  : null,
                f.address,
                f.rating != null
                  ? `★ ${String(f.rating).replace(".", ",")}${f.review_count ? ` (${fill(t.reviews, { n: String(f.review_count) })})` : ""}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {(waNumber(f.phone) || f.email) && (
              <p className="mt-0.5 text-sm text-slate-500">
                {[waNumber(f.phone) && o.mobile, f.email && o.emailFound].filter(Boolean).join(" · ")}
              </p>
            )}
            <FirmOfferState offer={offers.get(f.id)} firmId={f.id} o={o} dateFmt={dateFmt} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/dashboard/leads/firms/${f.id}`} className={`${button} bg-purple-50`}>
                {a.button}
              </Link>
              {f.website && (
                <a
                  href={f.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={button}
                >
                  {t.site}
                </a>
              )}
              {f.phone && (
                <a
                  href={`tel:${f.phone.replace(/\s/g, "")}`}
                  className={button}
                >
                  📞 {t.call}
                </a>
              )}
              {(f.place_id || f.maps_url) && (
                <a
                  href={mapsLink(f)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={button}
                >
                  {t.map}
                </a>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-400">{t.source}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}

