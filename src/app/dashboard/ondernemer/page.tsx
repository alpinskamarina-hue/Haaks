import Link from "next/link";
import { PassportTabs } from "@/components/PassportTabs";
import { fillO, getOndernemerDict, loadOndernemer, PUBLIC_MIN, SIGN_HREF } from "@/lib/ondernemer";
import { withDefaults, type WorkerProfile } from "@/lib/worker-profile";
import { loadWorkspace } from "@/lib/workspace";

// «Я настоящий предприниматель»: the signs of real self-employment (Wet DBA) counted from the builder's
// own work in Haaks, what is missing and where to fix it. Clients see the true ones in the passport.
export default async function OndernemerPage() {
  const { supabase, user, profile, lang } = await loadWorkspace();
  const d = getOndernemerDict(lang);
  const worker = withDefaults(profile as unknown as Partial<WorkerProfile>);
  const signs = await loadOndernemer(supabase, profile, worker);
  const ok = signs.filter((s) => s.ok).length;
  const shown = ok >= PUBLIC_MIN && profile.passport_enabled;

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <PassportTabs active="business" lang={lang} userId={user.id} token={profile.passport_token} username={(profile as { username?: string | null }).username} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold">💼 {d.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{d.intro}</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${ok >= PUBLIC_MIN ? "bg-green-500" : "bg-orange-500"}`} style={{ width: `${Math.round((ok / signs.length) * 100)}%` }} />
          </div>
          <span className="whitespace-nowrap text-sm font-semibold">{fillO(d.score, { n: ok, total: signs.length })}</span>
        </div>
        <p className={`mt-2 text-sm ${shown ? "text-green-800" : "text-slate-600"}`}>
          {shown ? d.strong : ok >= PUBLIC_MIN ? d.hidden : fillO(d.weak, { min: PUBLIC_MIN })}
        </p>
      </section>

      <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
        {signs.map((s) => {
          const text = d.signs[s.id];
          return (
            <li key={s.id} className="flex items-start gap-3 p-4">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  s.ok ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                }`}
                aria-hidden
              >
                {s.ok ? "✓" : "○"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{text.name}</p>
                <p className={`text-sm ${s.ok ? "text-green-800" : "text-slate-600"}`}>{fillO(s.ok ? text.ok : text.todo, s.vars)}</p>
              </div>
              {!s.ok && (
                <Link href={SIGN_HREF[s.id]} className="shrink-0 rounded-lg border border-orange-300 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-50">
                  {d.fix}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-sm text-slate-600">{d.shown}</p>

      <details className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <summary className="cursor-pointer font-semibold">{d.why}</summary>
        <p className="mt-2 text-slate-600">{d.whyText}</p>
      </details>
    </main>
  );
}

