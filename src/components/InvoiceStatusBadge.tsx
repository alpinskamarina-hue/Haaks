import type { Dict } from "@/lib/i18n";
import type { Invoice } from "@/lib/invoices";

const COLORS: Record<Invoice["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
};

export function InvoiceStatusBadge({ status, t }: { status: Invoice["status"]; t: Dict }) {
  const label = { draft: t.statusDraft, sent: t.statusSent, paid: t.statusPaid };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLORS[status]}`}>{label[status]}</span>;
}
