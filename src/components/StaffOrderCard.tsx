"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveStaffOrder } from "@/app/staff-actions";
import type { StaffOrderDict } from "@/lib/staff-profile-i18n";
import type { StaffOrderChange } from "@/lib/staff-orders";

const date = (v: string) => v.split("-").reverse().join(".");

// Step 3 of «Сотрудник заполняет данные»: a new order, hours or a receipt the employee prepared.
// Only the worker's tap saves it.
export function StaffOrderCard({ messageId, card, doneHref, d }: { messageId: string; card: StaffOrderChange; doneHref: string | null; d: StaffOrderDict }) {
  const [href, setHref] = useState(doneHref);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const title = card.kind === "new" ? d.newTitle : card.kind === "hours" ? d.hoursTitle : card.kind === "invoice" ? d.invoiceTitle : d.receiptTitle;
  const euro = (n: number) => `€ ${n.toFixed(2).replace(".", ",")}`;

  return (
    <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm">
      <p className="font-semibold">
        {card.kind === "receipt" ? "🧾" : card.kind === "hours" ? "⏱" : card.kind === "invoice" ? "💶" : "🏗"} {title}: {card.kind === "new" ? card.title : card.order_title}
      </p>
      {card.kind === "new" && (
        <ul className="mt-2 space-y-1">
          {card.client_name && <Row label={d.client} value={card.client_name} />}
          {card.address && <Row label={d.address} value={card.address} />}
          {card.hourly_rate !== null && <Row label={d.rate} value={`€ ${card.hourly_rate}`} />}
        </ul>
      )}
      {card.kind === "hours" && (
        <ul className="mt-2 space-y-1">
          {card.entries.map((e, i) => (
            <Row key={i} label={`${date(e.work_date)}${e.note ? ` · ${e.note}` : ""}`} value={`${e.hours} ${d.h}`} />
          ))}
          {card.entries.length > 1 && <Row label={d.total} value={`${card.entries.reduce((s, e) => s + e.hours, 0)} ${d.h}`} />}
        </ul>
      )}
      {card.kind === "invoice" && (
        <ul className="mt-2 space-y-1">
          {card.client_name && <Row label={d.client} value={card.client_name} />}
          {card.hours > 0 && <Row label={d.hoursLine} value={`${card.hours} ${d.h} × ${euro(card.rate ?? 0)} = ${euro(card.hours * (card.rate ?? 0))}`} />}
          {card.receipts > 0 && <Row label={`${d.materials} (${card.receipts})`} value={euro(card.materials * (1 + card.markup_percent / 100))} />}
          {card.markup_percent > 0 && <Row label={d.markup} value={`${card.markup_percent}%`} />}
        </ul>
      )}
      {card.kind === "receipt" && <p className="mt-1 text-slate-600">{d.receiptHint}</p>}
      {href ? (
        <Link href={href} className="mt-3 block rounded-xl bg-orange-600 py-2.5 text-center font-semibold text-white">
          ✓ {card.kind === "invoice" ? d.openInvoice : `${d.done} · ${d.open}`}
        </Link>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(false);
              const res = await saveStaffOrder(messageId);
              if ("href" in res) setHref(res.href);
              else setError(true);
            })
          }
          className="mt-3 w-full rounded-xl bg-orange-600 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "…" : card.kind === "new" ? d.create : card.kind === "invoice" ? d.makeInvoice : d.add}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-700">{d.failed}</p>}
      {!href && <p className="mt-2 text-xs text-slate-500">🔒 {card.kind === "invoice" ? d.invoiceNote : d.note}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </li>
  );
}
