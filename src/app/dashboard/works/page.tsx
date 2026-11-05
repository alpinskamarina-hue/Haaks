import Link from "next/link";
import { PassportTabs } from "@/components/PassportTabs";
import { WorkCard } from "@/components/WorkCard";
import { getWorkerDict } from "@/lib/worker-profile-text";
import type { Work } from "@/lib/works";
import { getWorksDict } from "@/lib/works-i18n";
import { loadWorkspace, signedUrls } from "@/lib/workspace";

export default async function WorksPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const { supabase, user, profile, lang } = await loadWorkspace();
  const w = getWorksDict(lang);
  const { data } = await supabase
    .from("works")
    .select("*")
    .eq("user_id", user.id)
    .order("done_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<Work[]>();
  const works = data ?? [];
  const urls = await signedUrls(supabase, works.flatMap((x) => [...x.photos_after, ...x.photos_before]));
  const trades = getWorkerDict(lang).trades as Record<string, string>;

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <PassportTabs active="works" lang={lang} userId={user.id} token={profile.passport_token} username={(profile as { username?: string | null }).username} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 flex-1 text-slate-600">{w.intro}</p>
        <Link href="/dashboard/works/new" className="rounded-lg bg-orange-600 px-4 py-2.5 font-semibold text-white">
          {w.add}
        </Link>
      </div>
      {saved && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-800">✓ {w.saved}</p>}
      {works.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">{w.empty}</p>}
      <ul className="space-y-4">
        {works.map((x) => (
          <li key={x.id} id={`work-${x.id}`}>
            <WorkCard
              work={x}
              lang={lang}
              trade={x.trade ? trades[x.trade] : null}
              urls={urls}
              labels={{ before: w.before.replace(/\s*\(.*\)$/, ""), after: w.after, edit: w.formEdit }}
              editHref={`/dashboard/works/${x.id}`}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
