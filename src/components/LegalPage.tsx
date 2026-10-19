import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { fillCompany } from "@/lib/company";
import { LEGAL, legalSummary, type LegalKind, type LegalLang } from "@/lib/legal";
import { requestLang } from "@/lib/lang";

// Full legal text in Dutch or English, with a short summary in the visitor's language.
export async function LegalPage({ kind, version }: { kind: LegalKind; version?: string }) {
  const lang = await requestLang();
  const legalLang: LegalLang = version === "nl" || version === "en" ? version : lang === "nl" ? "nl" : "en";
  const doc = LEGAL[kind][legalLang];
  const s = legalSummary(lang);
  const showBinding = legalLang === "en" ? lang !== "nl" : lang === "nl";

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold">
            Haaks<span className="text-orange-600">.</span>
          </Link>
          <div className="flex gap-3 text-sm">
            {(["nl", "en"] as const).map((v) => (
              <Link
                key={v}
                href={`/${kind}?v=${v}`}
                className={v === legalLang ? "font-semibold text-orange-700" : "text-slate-500"}
              >
                {v === "nl" ? "Nederlands" : "English"}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">{doc.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{doc.updated}</p>

        <section className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <h2 className="font-semibold">{s.summaryTitle}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
            {s[kind].map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {showBinding && <p className="mt-3 text-sm text-slate-500">{s.binding}</p>}
        </section>

        <div className="mt-8 space-y-7">
          {doc.sections.map((sec) => (
            <section key={sec.h}>
              <h2 className="text-lg font-semibold">{sec.h}</h2>
              {sec.p.map((para) => (
                <p key={para} className="mt-2 leading-relaxed text-slate-700">
                  {fillCompany(para)}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>

      <SiteFooter lang={lang} />
    </div>
  );
}
