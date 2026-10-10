"use client";

import { useState, useTransition } from "react";
import { saveInvoice } from "@/app/invoices-actions";
import { LinesEditor } from "@/components/LinesEditor";
import type { Dict } from "@/lib/i18n";
import { invoiceTotals, VAT_MODES, type Invoice, type VatMode } from "@/lib/invoices";
import { euro } from "@/lib/orders";

type Editable = Parameters<typeof saveInvoice>[1];

export function InvoiceEditor({ t, invoice }: { t: Dict; invoice: Invoice }) {
  const [data, setData] = useState<Editable>({
    number: invoice.number,
    vat_mode: invoice.vat_mode,
    invoice_date: invoice.invoice_date,
    due_date: invoice.due_date,
    work_period: invoice.work_period,
    project_address: invoice.project_address,
    client_name: invoice.client_name,
    client_address: invoice.client_address,
    client_kvk: invoice.client_kvk,
    client_btw: invoice.client_btw,
    lines: invoice.lines.map((l) => ({ ...l, quantity: Number(l.quantity), unit_price: Number(l.unit_price) })),
    notes: invoice.notes,
  });
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof Editable>(key: K, value: Editable[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setDirty(true);
    setSaved(false);
  };

  const sum = invoiceTotals(data.lines, data.vat_mode);
  const field = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2";
  const modeText: Record<VatMode, [string, string]> = {
    normal: [t.vatModeNormal, t.vatModeNormalHint],
    reverse: [t.vatModeReverse, t.vatModeReverseHint],
    kor: [t.vatModeKor, t.vatModeKorHint],
  };
  const text = (key: "client_name" | "client_kvk" | "client_btw" | "project_address" | "work_period", label: string) => (
    <label className="block text-sm font-medium">
      {label}
      <input value={data[key] ?? ""} onChange={(e) => set(key, e.target.value)} className={field} />
    </label>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="col-span-2 block text-sm font-medium sm:col-span-1">
          {t.invoiceNumber}
          <input value={data.number} onChange={(e) => set("number", e.target.value)} className={field} />
        </label>
        <label className="block text-sm font-medium">
          {t.date}
          <input
            type="date"
            value={data.invoice_date}
            onChange={(e) => set("invoice_date", e.target.value)}
            className={field}
          />
        </label>
        <label className="block text-sm font-medium">
          {t.dueDate}
          <input
            type="date"
            value={data.due_date ?? ""}
            onChange={(e) => set("due_date", e.target.value || null)}
            className={field}
          />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 font-semibold">{t.vatModeTitle}</legend>
        <div className="space-y-2">
          {VAT_MODES.map((mode) => (
            <label
              key={mode}
              className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${data.vat_mode === mode ? "border-orange-500 bg-orange-50" : "border-slate-200"}`}
            >
              <input
                type="radio"
                name="vat_mode"
                checked={data.vat_mode === mode}
                onChange={() => set("vat_mode", mode)}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">{modeText[mode][0]}</span>
                <span className="block text-sm text-slate-600">{modeText[mode][1]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        {text("client_name", t.clientName)}
        <label className="block text-sm font-medium">
          {t.clientAddress}
          <textarea
            value={data.client_address ?? ""}
            onChange={(e) => set("client_address", e.target.value)}
            rows={2}
            className={field}
          />
        </label>
        {text("client_kvk", t.kvkNumber)}
        {text("client_btw", t.clientBtw)}
      </div>
      {data.vat_mode === "reverse" && !data.client_btw?.trim() && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">⚠ {t.reverseNeedsBtw}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {text("project_address", t.projectAddress)}
        {text("work_period", t.workPeriod)}
      </div>

      <LinesEditor
        t={t}
        lines={data.lines}
        onChange={(lines) => set("lines", lines)}
        showVat={data.vat_mode === "normal"}
      />

      <dl className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
        <div className="flex justify-between">
          <dt>{t.exclVat}</dt>
          <dd>{euro(sum.excl)}</dd>
        </div>
        {data.vat_mode === "normal" ? (
          sum.vatLines.map((v) => (
            <div key={v.rate} className="flex justify-between text-slate-600">
              <dt>
                {t.vat} {v.rate}%
              </dt>
              <dd>{euro(v.vat)}</dd>
            </div>
          ))
        ) : (
          <div className="flex justify-between text-slate-600">
            <dt>{data.vat_mode === "reverse" ? "Btw verlegd" : "KOR"}</dt>
            <dd>{euro(0)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold">
          <dt>{t.toPay}</dt>
          <dd>{euro(sum.incl)}</dd>
        </div>
      </dl>

      <label className="block text-sm font-medium">
        {t.invoiceNotes}
        <textarea
          value={data.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          className={field}
        />
      </label>

      <div className="sticky bottom-3 flex items-center gap-3">
        <button
          type="button"
          disabled={pending || !dirty}
          onClick={() =>
            startTransition(async () => {
              await saveInvoice(invoice.id, data);
              setDirty(false);
              setSaved(true);
            })
          }
          className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white shadow disabled:opacity-60"
        >
          {pending ? "…" : t.save}
        </button>
        {saved && <span className="text-sm text-green-700">✓ {t.saved}</span>}
      </div>
    </div>
  );
}
