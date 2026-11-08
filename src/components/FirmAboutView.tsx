import { fill } from "@/lib/feed-i18n";
import type { FirmAbout } from "@/lib/firm-about";
import { yearsText, type FirmAboutDict } from "@/lib/firm-about-i18n";
import { getFirmsDict } from "@/lib/firms-i18n";
import type { Lang } from "@/lib/i18n";

export type AboutFirm = {
  id: string;
  place_id: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  lat: number | null;
  lng: number | null;
  categories: string[] | null;
  about: FirmAbout | null;
  about_at: string | null;
};

const box = "rounded-2xl border border-slate-200 bg-white p-4";

// Facts and the AI summary of one firm («О компании»).
export function FirmAboutView({ firm, about, lang, t }: { firm: AboutFirm; about: FirmAbout; lang: Lang; t: FirmAboutDict }) {
  const text = about.texts[lang];
  const years = about.since ? new Date().getFullYear() - about.since : null;
  const updated = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : lang, { day: "2-digit", month: "2-digit" }).format(
    new Date((firm.about?.texts[lang] && firm.about_at) || Date.now()),
  );
  const reviews = getFirmsDict(lang).reviews;

  return (
    <>
      <div className="flex flex-wrap gap-2 text-sm">
        {about.hires_zzp && <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-800">{t.hiresZzp}</span>}
        {about.vacancies && <span className="rounded-full bg-slate-100 px-3 py-1">{t.vacancies}</span>}
        {firm.rating != null && (
          <span className="rounded-full bg-slate-100 px-3 py-1">
            ★ {String(firm.rating).replace(".", ",")}
            {firm.review_count ? ` · ${fill(reviews, { n: String(firm.review_count) })}` : ""}
          </span>
        )}
      </div>

      {(years != null || about.employees) && (
        <div className="grid grid-cols-2 gap-2">
          {years != null && about.since && (
            <div className={box}>
              <p className="text-lg font-bold">{yearsText(t, lang, years)}</p>
              <p className="text-xs text-slate-500">{fill(t.sinceYear, { y: String(about.since) })}</p>
            </div>
          )}
          {about.employees && (
            <div className={box}>
              <p className="text-lg font-bold">{about.employees}</p>
              <p className="text-xs text-slate-500">{t.staff}</p>
            </div>
          )}
        </div>
      )}

      {text ? (
        <>
          <section className={box}>
            <h2 className="text-sm font-semibold text-slate-500">{t.what}</h2>
            <p className="mt-1 leading-relaxed">{text.summary}</p>
            <p className="mt-2 text-xs text-slate-400">{fill(t.aiNote, { date: updated })}</p>
          </section>
          {text.works.length > 0 && (
            <section className={box}>
              <h2 className="text-sm font-semibold text-slate-500">{t.works}</h2>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {text.works.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <p className={`${box} text-sm text-slate-600`}>
          {about.site === "none" ? t.noSite : about.site === "failed" ? t.siteFailed : t.noText}
        </p>
      )}

      {!text && (firm.categories ?? []).length > 0 && (
        <section className={box}>
          <h2 className="text-sm font-semibold text-slate-500">{t.google}</h2>
          <p className="mt-1 text-sm">{(firm.categories ?? []).join(", ")}</p>
        </section>
      )}
    </>
  );
}
