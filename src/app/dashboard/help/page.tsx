import Link from "next/link";
import { COMPANY } from "@/lib/company";
import { GUIDE_IDS, GUIDE_META, getHelp } from "@/lib/help";
import { loadWorkspace } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

// «Помощь»: a short guide for every part of Haaks, in the builder's language.
export default async function HelpPage() {
  const { lang } = await loadWorkspace();
  const h = getHelp(lang);

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">❓ {h.ui.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{h.ui.intro}</p>
      </div>

      <section className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
        <h2 className="font-bold">{h.ui.startTitle}</h2>
        <p className="mt-1 text-sm text-slate-700">{h.ui.startText}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["profile", "feed", "notify"] as const).map((id) => (
            <Link key={id} href={`/dashboard/help/${id}`} className="rounded-full border border-orange-300 bg-white px-3 py-1.5 text-sm font-semibold text-orange-800">
              {GUIDE_META[id].icon} {h.guides[id].title}
            </Link>
          ))}
        </div>
      </section>

      <ul className="grid gap-2 sm:grid-cols-2">
        {GUIDE_IDS.map((id) => (
          <li key={id}>
            <Link href={`/dashboard/help/${id}`} className={`${card} flex h-full items-start gap-3`}>
              <span className="text-2xl leading-none">{GUIDE_META[id].icon}</span>
              <span className="min-w-0">
                <b className="block">{h.guides[id].title}</b>
                <span className="line-clamp-2 text-sm text-slate-600">{h.guides[id].why}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className={card}>
        <h2 className="font-bold">{h.ui.askTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{h.ui.askText}</p>
        <a href={`mailto:${COMPANY.email}?subject=${encodeURIComponent("Haaks")}`} className="mt-3 inline-block rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">
          ✉️ {h.ui.askButton}
        </a>
      </section>
    </main>
  );
}
