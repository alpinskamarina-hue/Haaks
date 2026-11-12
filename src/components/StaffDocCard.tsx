"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveStaffDocument } from "@/app/staff-actions";
import type { StaffDocDict } from "@/lib/staff-profile-i18n";
import type { DocView } from "@/lib/staff-profile-view";

// Step 2 of «Сотрудник заполняет данные»: a document the employee read from a photo.
// Only the worker's tap adds it to the ZZP passport.
export function StaffDocCard({ messageId, view, done, d }: { messageId: string; view: DocView; done: boolean; d: StaffDocDict }) {
  const [saved, setSaved] = useState(done);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm">
      <p className="font-semibold">🪪 {d.title}: {view.kind}</p>
      {view.summary && <p className="mt-1 text-slate-600">{view.summary}</p>}
      {view.rows.length > 0 && (
        <ul className="mt-2 space-y-1">
          {view.rows.map((r) => (
            <li key={r.label} className="flex justify-between gap-2">
              <span className="text-slate-500">{r.label}</span>
              <span className="text-right font-medium">{r.value}</span>
            </li>
          ))}
        </ul>
      )}
      {view.warnings.map((w) => (
        <p key={w} className="mt-2 rounded-lg bg-amber-100 px-2 py-1 text-amber-900">
          ⚠️ {w}
        </p>
      ))}
      {view.fills.length > 0 && (
        <p className="mt-2 text-slate-600">
          {d.fills} {view.fills.join(", ")}
        </p>
      )}
      {saved ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="font-semibold text-emerald-700">✓ {d.added}</span>
          <Link href="/dashboard/passport" className="text-orange-700 underline">
            {d.open}
          </Link>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(false);
              const res = await saveStaffDocument(messageId);
              if ("ok" in res) setSaved(true);
              else setError(true);
            })
          }
          className="mt-3 w-full rounded-xl bg-orange-600 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "…" : d.add}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-700">{d.failed}</p>}
      {view.remind && <p className="mt-2 text-xs text-slate-500">🔔 {d.remind}</p>}
      {!saved && <p className="mt-1 text-xs text-slate-500">🔒 {d.note}</p>}
    </div>
  );
}
