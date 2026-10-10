import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import { scoreColor, SOURCE_LABELS, type Lead } from "@/lib/leads";

export function LeadCard({ lead, t, lang }: { lead: Lead; t: Dict; lang: string }) {
  const source = lead.source === "manual" ? t.leadSourceManual : (lead.source_name ?? SOURCE_LABELS[lead.source]);
  return (
    <li>
      <Link
        href={`/dashboard/leads/${lead.id}`}
        className="block rounded-xl border border-slate-200 p-4 transition hover:border-orange-300 hover:bg-orange-50/40"
      >
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">{source}</span>
          <span>{new Date(lead.created_at).toLocaleDateString(lang, { day: "numeric", month: "short" })}</span>
          {lead.match_score !== null && (
            <span className={`ml-auto rounded-full px-2 py-0.5 font-semibold ${scoreColor(lead.match_score)}`}>
              {lead.match_score}%
            </span>
          )}
        </div>
        <p className="mt-2 font-semibold">{lead.title ?? lead.raw_text.slice(0, 80)}</p>
        <p className="text-sm text-slate-500">
          {[lead.city, lead.trade, lead.timing].filter(Boolean).join(" · ") ||
            (lead.ai_status === "skipped" ? t.leadNotAnalyzed : "—")}
        </p>
        {lead.summary && <p className="mt-2 line-clamp-2 text-sm text-slate-700">{lead.summary}</p>}
      </Link>
    </li>
  );
}
