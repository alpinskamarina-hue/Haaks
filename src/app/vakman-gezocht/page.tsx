import type { Metadata } from "next";
import Link from "next/link";
import { ClientRequestForm } from "@/components/ClientRequestForm";
import { HtmlLang } from "@/components/HtmlLang";
import { PublicFooter } from "@/components/PublicFooter";
import { getClientDict } from "@/lib/client-request-i18n";

export const metadata: Metadata = {
  title: "Vakman gezocht · Haaks",
  description: "Beschrijf je klus. Zelfstandige vakmensen bij jou in de buurt reageren. Gratis, zonder tussenpersoon.",
};

// Public page for Dutch clients: post a job, builders nearby reply (see src/lib/client-requests.ts).
export default async function VakmanGezochtPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = (await searchParams).lang === "en" ? "en" : "nl";
  const t = getClientDict(lang);
  return (
    <main className="min-h-screen bg-slate-50">
      <HtmlLang lang={lang} />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/" className="grid h-9 w-9 place-items-center rounded-xl bg-orange-600 font-bold text-white">H</Link>
          <span className="font-semibold">Haaks · {t.brand}</span>
          <Link href={lang === "en" ? "/vakman-gezocht" : "/vakman-gezocht?lang=en"} className="ml-auto text-sm text-slate-500 underline">
            {lang === "en" ? "Nederlands" : "English"}
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div>
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <p className="mt-2 text-slate-600">{t.lead}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {t.promise.map((p) => (
              <span key={p} className="rounded-full bg-green-50 px-3 py-1 font-medium text-green-800">{p}</span>
            ))}
          </div>
        </div>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <ClientRequestForm t={t} lang={lang} />
        </section>
        <p className="text-center text-xs text-slate-500">{t.footer}</p>
        <PublicFooter />
      </div>
    </main>
  );
}
