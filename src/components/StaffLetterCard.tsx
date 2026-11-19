"use client";

import { useState, useTransition } from "react";
import { saveStaffLetterReminder } from "@/app/staff-actions";
import type { StaffLetterChange } from "@/lib/staff-letter";
import type { StaffLetterDict } from "@/lib/staff-letter-i18n";

export type StaffLetterView = {
  card: StaffLetterChange;
  // Days until the deadline (negative = passed), the day a reminder would come, and the day already set.
  daysLeft: number | null;
  remindDay: string | null;
  remindedDay: string | null;
};

const URGENCY: Record<StaffLetterChange["urgency"], string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
const dayLabel = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
const euro = (n: number) => `€ ${n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// A letter the employee read from a photo: who wrote, what it means, the deadline, what to do,
// a ready Dutch reply to copy, and one tap to be reminded before the deadline.
export function StaffLetterCard({ messageId, view, d }: { messageId: string; view: StaffLetterView; d: StaffLetterDict }) {
  const c = view.card;
  const [reminded, setReminded] = useState(view.remindedDay);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const left =
    view.daysLeft === null ? null : view.daysLeft < 0 ? d.overdue : view.daysLeft === 0 ? d.today : fill(d.daysLeft, { n: view.daysLeft });

  return (
    <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold">✉️ {d.title}: {c.sender}</p>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${URGENCY[c.urgency]}`}>{d.urgency[c.urgency]}</span>
      </div>
      {c.kind && <p className="text-xs text-slate-500">{c.kind}</p>}
      <p className="mt-2 font-semibold text-slate-900">{c.summary}</p>

      {(c.deadline || c.amount !== null) && (
        <div className="mt-2 space-y-1 rounded-lg bg-white p-2">
          {c.deadline && (
            <p>
              <span className="text-slate-500">{d.deadline}: </span>
              <b>{dayLabel(c.deadline)}</b>
              {left && <span className={`ml-1 text-xs font-semibold ${view.daysLeft !== null && view.daysLeft <= 3 ? "text-red-700" : "text-slate-500"}`}>({left})</span>}
              {c.deadline_what && <span className="block text-xs text-slate-600">{c.deadline_what}</span>}
            </p>
          )}
          {c.amount !== null && (
            <p>
              <span className="text-slate-500">{d.amount}: </span>
              <b>{euro(c.amount)}</b>
            </p>
          )}
          {c.payment_reference && (
            <p className="text-xs">
              <span className="text-slate-500">{d.reference}: </span>
              <span className="font-mono">{c.payment_reference}</span>
            </p>
          )}
          {c.pay_to && (
            <p className="text-xs">
              <span className="text-slate-500">{d.payTo}: </span>
              <span className="font-mono">{c.pay_to}</span>
            </p>
          )}
        </div>
      )}

      {c.steps.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase text-slate-500">{d.steps}</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5">
            {c.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      {c.reply_nl && (
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase text-slate-500">{d.reply}</p>
          <p className="mt-1 whitespace-pre-wrap rounded-lg bg-white p-2 text-slate-800">{c.reply_nl}</p>
          {c.reply_meaning && <p className="mt-1 text-xs text-slate-500">{c.reply_meaning}</p>}
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(c.reply_nl ?? "").then(() => setCopied(true));
            }}
            className="mt-2 w-full rounded-xl border border-indigo-300 bg-white py-2 font-semibold text-indigo-800"
          >
            {copied ? d.copied : d.copy}
          </button>
        </div>
      )}

      {reminded ? (
        <p className="mt-2 rounded-xl bg-green-100 py-2 text-center font-semibold text-green-800">{fill(d.reminded, { date: dayLabel(reminded) })}</p>
      ) : (
        view.remindDay && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setError(false);
                const res = await saveStaffLetterReminder(messageId);
                if ("day" in res) setReminded(res.day);
                else setError(true);
              })
            }
            className="mt-2 w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white disabled:opacity-60"
          >
            {pending ? "…" : fill(d.remind, { date: dayLabel(view.remindDay) })}
          </button>
        )
      )}
      {error && <p className="mt-2 text-xs text-red-700">{d.failed}</p>}
      <p className="mt-2 text-xs text-slate-500">⚠️ {d.note}</p>
    </div>
  );
}
