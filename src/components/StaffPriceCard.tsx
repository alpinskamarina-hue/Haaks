"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveStaffPrices } from "@/app/staff-actions";
import type { StaffPriceDict } from "@/lib/staff-profile-i18n";
import type { StaffPriceChange } from "@/lib/staff-prices";

// A price change the employee prepared (order rate, quote or draft invoice lines): old → new.
// Only the worker's tap changes it.
export function StaffPriceCard({ messageId, card, doneHref, d }: { messageId: string; card: StaffPriceChange; doneHref: string | null; d: StaffPriceDict }) {
  const [href, setHref] = useState(doneHref);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm">
      <p className="font-semibold">✏️ {d.title}: {card.title}</p>
      <ul className="mt-2 space-y-2">
        {card.rows.map((r, i) => (
          <li key={i}>
            <p className="text-xs text-slate-500">{r.label}</p>
            <p>
              {r.before ? <span className="text-slate-400 line-through">{r.before}</span> : <span className="text-emerald-700">+ {d.added}</span>}
              {" → "}
              {r.after ? <span className="font-medium">{r.after}</span> : <span className="font-medium text-red-700">{d.removed}</span>}
            </p>
          </li>
        ))}
      </ul>
      {href ? (
        <Link href={href} className="mt-3 block rounded-xl bg-orange-600 py-2.5 text-center font-semibold text-white">
          ✓ {d.changed} · {d.open}
        </Link>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const res = await saveStaffPrices(messageId);
              if ("href" in res) setHref(res.href);
              else setError(res.error === "stale" ? d.stale : d.failed);
            })
          }
          className="mt-3 w-full rounded-xl bg-orange-600 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "…" : d.change}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      {!href && <p className="mt-2 text-xs text-slate-500">🔒 {d.note}</p>}
    </div>
  );
}
