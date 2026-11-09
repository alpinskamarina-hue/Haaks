import { getFeedSourceDict, type FeedSource } from "@/lib/feed-source-i18n";
import type { Lang } from "@/lib/i18n";

// Colours match the feed tiles (src/components/FeedTile.tsx).
const STYLE: Record<FeedSource, { box: string; title: string; icon: string }> = {
  all: { box: "border-l-slate-700 bg-slate-100", title: "text-slate-900", icon: "🗂️" },
  jobs: { box: "border-l-orange-500 bg-orange-50", title: "text-orange-900", icon: "🔥" },
  soon: { box: "border-l-green-600 bg-green-50", title: "text-green-900", icon: "🏗" },
  tender: { box: "border-l-blue-600 bg-blue-50", title: "text-blue-900", icon: "📋" },
  business: { box: "border-l-purple-600 bg-purple-50", title: "text-purple-900", icon: "🏢" },
  received: { box: "border-l-rose-600 bg-rose-50", title: "text-rose-900", icon: "📨" },
  firms: { box: "border-l-violet-700 bg-violet-50", title: "text-violet-950", icon: "🏬" },
  helper: { box: "border-l-sky-600 bg-sky-50", title: "text-sky-900", icon: "👷" },
};

// A short note under the feed tiles: a bold line saying where the jobs come from, then what to do.
export function FeedSourceInfo({ source, lang, text, className = "" }: { source: FeedSource; lang: Lang; text?: string; className?: string }) {
  const info = getFeedSourceDict(lang)[source];
  const s = STYLE[source];
  return (
    <div className={`rounded-xl border-l-4 px-4 py-3 ${s.box} ${className}`}>
      <p className={`font-extrabold leading-snug ${s.title}`}>
        {s.icon} {info.title}
      </p>
      <p className="mt-1 text-sm text-slate-700">{text ?? info.text}</p>
    </div>
  );
}
