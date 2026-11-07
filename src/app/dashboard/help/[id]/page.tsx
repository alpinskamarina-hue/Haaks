import Link from "next/link";
import { notFound } from "next/navigation";
import { COMPANY } from "@/lib/company";
import { GUIDE_IDS, GUIDE_META, getHelp, isGuideId } from "@/lib/help";
import { loadWorkspace } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

// One guide: why it is useful, the steps, tips and a button straight into that part of Haaks.
export default async function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isGuideId(id)) notFound();
  const { lang } = await loadWorkspace();
  const h = getHelp(lang);
  const g = h.guides[id];
  const meta = GUIDE_META[id];
  const at = GUIDE_IDS.indexOf(id);
  const prev = at > 0 ? GUIDE_IDS[at - 1] : null;
  const next = at < GUIDE_IDS.length - 1 ? GUIDE_IDS[at + 1] : null;

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <Link href="/dashboard/help" className="text-sm text-slate-600 underline">
        ← {h.ui.all}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">
          {meta.icon} {g.title}
        </h1>
        <p className="mt-1 text-slate-700">{g.why}</p>
      </div>

      <section className={card}>
        <h2 className="mb-3 font-bold">{h.ui.how}</h2>
        <ol className="space-y-3">
          {g.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-600 text-sm font-bold text-white">{i + 1}</span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <Link href={meta.href} className="mt-4 block rounded-lg bg-orange-600 px-4 py-3 text-center font-bold text-white">
          {h.ui.open} →
        </Link>
      </section>

      {g.tips.length > 0 && (
        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <h2 className="mb-2 font-bold">💡 {h.ui.tips}</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
            {g.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </section>
      )}

      <nav className="grid grid-cols-2 gap-2 text-sm">
        {prev ? (
          <Link href={`/dashboard/help/${prev}`} className={`${card} min-w-0`}>
            <span className="block text-xs text-slate-500">← {h.ui.prev}</span>
            <b className="block truncate">{h.guides[prev].title}</b>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/dashboard/help/${next}`} className={`${card} min-w-0 text-right`}>
            <span className="block text-xs text-slate-500">{h.ui.next} →</span>
            <b className="block truncate">{h.guides[next].title}</b>
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <p className="text-center text-sm text-slate-500">
        {h.ui.askTitle}{" "}
        <a href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(`Haaks: ${g.title}`)}`} className="font-semibold text-orange-700 underline">
          {h.ui.askButton}
        </a>
      </p>
    </main>
  );
}
