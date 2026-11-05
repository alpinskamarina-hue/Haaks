import { reportTarget } from "@/app/feed-actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { ReportDict, ReportReason } from "@/lib/report-i18n";

// "Report": opens a short list of reasons; Haaks sees the report in moderation.
export function ReportButton({
  kind,
  target,
  reasons,
  t,
  sent,
}: {
  kind: "job" | "worker";
  target: string;
  reasons: readonly ReportReason[];
  t: ReportDict;
  sent: boolean;
}) {
  if (sent) return <p className="text-xs text-slate-400">⚠️ {t.sent}</p>;
  return (
    <details className="text-sm">
      <summary className="cursor-pointer list-none text-xs text-slate-400 hover:text-slate-600">⚠️ {t.report}</summary>
      <form action={reportTarget} className="mt-2 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="target" value={target} />
        {reasons.map((r, i) => (
          <label key={r} className="flex items-start gap-2">
            <input type="radio" name="reason" value={r} defaultChecked={i === 0} className="mt-1 accent-red-600" />
            {t.reasons[r]}
          </label>
        ))}
        <SubmitButton className="mt-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 disabled:opacity-60">
          {t.send}
        </SubmitButton>
      </form>
    </details>
  );
}
