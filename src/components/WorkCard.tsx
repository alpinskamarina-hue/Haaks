import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { monthLabel, type Work } from "@/lib/works";

// One completed work: the main "after" photo, more photos below, then what, where and when.
// Used in the builder's cabinet and in the public passport.
export function WorkCard({
  work,
  lang,
  trade,
  urls,
  labels,
  editHref,
}: {
  work: Pick<Work, "title" | "description" | "city" | "done_on" | "photos_before" | "photos_after">;
  lang: Lang;
  trade: string | null;
  urls: Map<string, string>;
  labels: { before: string; after: string; edit?: string };
  editHref?: string;
}) {
  const after = work.photos_after.flatMap((p) => urls.get(p) ?? []);
  const before = work.photos_before.flatMap((p) => urls.get(p) ?? []);
  const [main, ...rest] = after;
  const thumbs = [...rest.map((u) => ({ u, before: false })), ...before.map((u) => ({ u, before: true }))];
  const meta = [trade, work.city, monthLabel(work.done_on, lang)].filter(Boolean).join(" · ");

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {main && (
        <a href={main} target="_blank" rel="noopener" className="relative block aspect-[4/3] bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={main} alt="" className="h-full w-full object-cover" />
          {before.length > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">{labels.after}</span>
          )}
        </a>
      )}
      {thumbs.length > 0 && (
        <div className="grid grid-cols-4 gap-1 p-1">
          {thumbs.map((x) => (
            <a key={x.u} href={x.u} target="_blank" rel="noopener" className="relative block aspect-square overflow-hidden rounded-md bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.u} alt="" className="h-full w-full object-cover" />
              {x.before && <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-[10px] font-semibold text-white">{labels.before}</span>}
            </a>
          ))}
        </div>
      )}
      <div className="space-y-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold">{work.title}</h3>
          {editHref && (
            <Link href={editHref} className="shrink-0 text-sm font-medium text-orange-700 underline">
              ✏️ {labels.edit}
            </Link>
          )}
        </div>
        {meta && <p className="text-sm text-slate-500">{meta}</p>}
        {work.description && <p className="whitespace-pre-line text-sm text-slate-700">{work.description}</p>}
      </div>
    </article>
  );
}
