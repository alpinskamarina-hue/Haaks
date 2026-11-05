import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteWork } from "@/app/works-actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { WorkForm } from "@/components/WorkForm";
import { getWorkerDict } from "@/lib/worker-profile-text";
import { TRADES } from "@/lib/worker-profile";
import type { Work } from "@/lib/works";
import { getWorksDict } from "@/lib/works-i18n";
import { loadWorkspace, signedUrls } from "@/lib/workspace";

export default async function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, lang, t } = await loadWorkspace();
  const w = getWorksDict(lang);
  const wd = getWorkerDict(lang);
  const { data: work } = await supabase.from("works").select("*").eq("id", id).eq("user_id", user.id).maybeSingle<Work>();
  if (!work) notFound();
  const urls = await signedUrls(supabase, [...work.photos_before, ...work.photos_after]);
  const withUrl = (paths: string[]) => paths.map((path) => ({ path, url: urls.get(path) ?? "" }));

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <Link href="/dashboard/works" className="text-sm text-slate-600 underline">
        ← {t.back}
      </Link>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="mb-4 text-2xl font-bold">{w.formEdit}</h1>
        <WorkForm
          w={w}
          t={t}
          userId={user.id}
          trades={TRADES.map((tid) => ({ id: tid, name: wd.trades[tid] }))}
          initial={{
            id: work.id,
            title: work.title,
            description: work.description ?? "",
            trade: work.trade ?? "",
            city: work.city ?? "",
            month: work.done_on?.slice(0, 7) ?? "",
            before: withUrl(work.photos_before),
            after: withUrl(work.photos_after),
          }}
        />
      </section>
      <form action={deleteWork}>
        <input type="hidden" name="id" value={work.id} />
        <ConfirmButton message={w.removeConfirm} className="text-sm font-medium text-red-700 underline">
          {w.remove}
        </ConfirmButton>
      </form>
    </main>
  );
}
