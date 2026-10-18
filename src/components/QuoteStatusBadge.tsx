import type { Dict } from "@/lib/i18n";
import type { Quote } from "@/lib/quotes";

const COLORS: Record<Quote["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
};

export function QuoteStatusBadge({ status, t }: { status: Quote["status"]; t: Dict }) {
  const label = { draft: t.statusDraft, sent: t.statusSent, accepted: t.statusAccepted, declined: t.statusDeclined };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLORS[status]}`}>{label[status]}</span>;
}
