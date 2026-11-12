"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveStaffProfile } from "@/app/staff-actions";
import type { StaffProfileDict } from "@/lib/staff-profile-i18n";
import type { ProfileRow } from "@/lib/staff-profile-view";

// Step 1 of «Сотрудник заполняет данные»: profile details the employee heard from the worker.
// Old → new for each field; only the worker's tap on «Сохранить» writes them.
export function StaffProfileCard({ messageId, rows, done, d }: { messageId: string; rows: ProfileRow[]; done: boolean; d: StaffProfileDict }) {
  const [saved, setSaved] = useState(done);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  if (!rows.length) return null;

  return (
    <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm">
      <p className="font-semibold">👤 {d.title}</p>
      <ul className="mt-2 space-y-1.5">
        {rows.map((r) => (
          <li key={r.label}>
            <span className="text-xs text-slate-500">{r.label}</span>
            <p className="whitespace-pre-line">
              {r.before && <span className="text-slate-400 line-through">{r.before}</span>}
              {r.before && " → "}
              <span className="font-medium">{r.after}</span>
            </p>
          </li>
        ))}
      </ul>
      {saved ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="font-semibold text-emerald-700">✓ {d.saved}</span>
          <Link href="/dashboard/profile" className="text-orange-700 underline">
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
              const res = await saveStaffProfile(messageId);
              if ("ok" in res) setSaved(true);
              else setError(true);
            })
          }
          className="mt-3 w-full rounded-xl bg-orange-600 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "…" : d.save}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-700">{d.failed}</p>}
      {!saved && <p className="mt-2 text-xs text-slate-500">🔒 {d.note}</p>}
    </div>
  );
}
