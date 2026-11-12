"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createFromStaffDraft } from "@/app/staff-actions";
import { invoiceTotals } from "@/lib/invoices";
import type { StaffDraftDict } from "@/lib/staff-draft-i18n";
import type { StaffDraft } from "@/lib/staff-tools";

const euro = (n: number) => `€ ${n.toFixed(2).replace(".", ",")}`;

// Step 5b: a draft invoice or quote the employee prepared. Only the worker's tap creates it,
// and it is created as a draft that they check and send themselves.
export function StaffDraftCard({ messageId, draft, doneHref, d }: { messageId: string; draft: StaffDraft; doneHref: string | null; d: StaffDraftDict }) {
  const [href, setHref] = useState(doneHref);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const totals = invoiceTotals(draft.lines, draft.type === "invoice" ? draft.vat_mode : "normal");

  return (
    <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm">
      <p className="font-semibold">
        {draft.type === "invoice" ? "🧾" : "📝"} {draft.type === "invoice" ? d.invoice : d.quote}
        {draft.client_name ? ` · ${draft.client_name}` : ""}
      </p>
      {draft.title && <p className="text-slate-600">{draft.title}</p>}
      <ul className="mt-2 space-y-1">
        {draft.lines.map((l, i) => (
          <li key={i} className="flex justify-between gap-2">
            <span>
              {l.description} · {l.quantity} {l.unit} × {euro(l.unit_price)}
            </span>
            <span className="shrink-0">{euro(l.quantity * l.unit_price)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 flex justify-between border-t border-orange-200 pt-2 font-semibold">
        <span>{d.total}</span>
        <span>{euro(totals.incl)}</span>
      </p>
      {href ? (
        <Link href={href} className="mt-3 block rounded-xl bg-orange-600 py-2.5 text-center font-semibold text-white">
          ✓ {d.open}
        </Link>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(false);
              const res = await createFromStaffDraft(messageId);
              if ("href" in res) setHref(res.href);
              else setError(true);
            })
          }
          className="mt-3 w-full rounded-xl bg-orange-600 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "…" : d.create}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-700">{d.failed}</p>}
      <p className="mt-2 text-xs text-slate-500">🔒 {d.note}</p>
    </div>
  );
}
