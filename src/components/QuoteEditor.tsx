"use client";

import { useState, useTransition } from "react";
import { saveQuote } from "@/app/quotes-actions";
import type { Dict } from "@/lib/i18n";
import { euro } from "@/lib/orders";
import { LINE_KINDS, lineTotal, quoteTotals, VAT_RATES, type Quote, type QuoteLine } from "@/lib/quotes";

type Editable = Pick<Quote, "title" | "client_name" | "client_address" | "intro" | "terms" | "valid_until" | "lines">;

// Worker's own language for labels; the texts the client reads stay in Dutch.
export function QuoteEditor({ t, quote }: { t: Dict; quote: Quote }) {
  const [data, setData] = useState<Editable>({
    title: quote.title,
    client_name: quote.client_name,
    client_address: quote.client_address,
    intro: quote.intro,
    terms: quote.terms,
    valid_until: quote.valid_until,
    lines: quote.lines.map((l) => ({ ...l, quantity: Number(l.quantity), unit_price: Number(l.unit_price) })),
  });
  // Stable keys so the number inputs keep their text when a line above is removed.
  const [keys, setKeys] = useState(() => quote.lines.map((_, i) => i));
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof Editable>(key: K, value: Editable[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setDirty(true);
    setSaved(false);
  };
  const setLine = (i: number, patch: Partial<QuoteLine>) =>
    set(
      "lines",
      data.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)),
    );

  const sum = quoteTotals(data.lines);
  const kindLabel = { labour: t.kindLabour, material: t.kindMaterial, other: t.kindOther };
  const field = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2";
  const small = "w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm";
  const num = (v: string) => Number(v.replace(",", ".")) || 0;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">
        {t.quoteTitleLabel}
        <input value={data.title} onChange={(e) => set("title", e.target.value)} className={field} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {t.clientName}
          <input
            value={data.client_name ?? ""}
            onChange={(e) => set("client_name", e.target.value)}
            className={field}
          />
        </label>
        <label className="block text-sm font-medium">
          {t.address}
          <input
            value={data.client_address ?? ""}
            onChange={(e) => set("client_address", e.target.value)}
            className={field}
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        {t.quoteIntro}
        <textarea
          value={data.intro ?? ""}
          onChange={(e) => set("intro", e.target.value)}
          rows={3}
          className={field}
        />
      </label>

      <div>
        <h3 className="mb-2 font-semibold">{t.quoteLines}</h3>
        <ul className="space-y-3">
          {data.lines.map((line, i) => (
            <li key={keys[i]} className="space-y-2 rounded-xl border border-slate-200 p-3">
              <div className="flex gap-2">
                <select
                  value={line.kind}
                  onChange={(e) => setLine(i, { kind: e.target.value as QuoteLine["kind"] })}
                  className={`${small} w-auto`}
                >
                  {LINE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {kindLabel[k]}
                    </option>
                  ))}
                </select>
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={() => {
                    set("lines", data.lines.filter((_, j) => j !== i));
                    setKeys((k) => k.filter((_, j) => j !== i));
                  }}
                  className="px-2 text-slate-500"
                  aria-label={t.delete}
                >
                  ✕
                </button>
              </div>
              <textarea
                value={line.description}
                onChange={(e) => setLine(i, { description: e.target.value })}
                placeholder={t.lineDescription}
                rows={2}
                className={small}
              />
              <div className="grid grid-cols-[1fr_1fr_1.3fr_1fr] items-end gap-2 text-xs text-slate-500">
                <label>
                  {t.quantity}
                  <input
                    defaultValue={line.quantity}
                    inputMode="decimal"
                    onChange={(e) => setLine(i, { quantity: num(e.target.value) })}
                    className={small}
                  />
                </label>
                <label>
                  {t.unit}
                  <input value={line.unit} onChange={(e) => setLine(i, { unit: e.target.value })} className={small} />
                </label>
                <label>
                  {t.unitPrice}
                  <input
                    defaultValue={line.unit_price}
                    inputMode="decimal"
                    onChange={(e) => setLine(i, { unit_price: num(e.target.value) })}
                    className={small}
                  />
                </label>
                <label>
                  {t.vat}
                  <select
                    value={line.vat_rate}
                    onChange={(e) => setLine(i, { vat_rate: Number(e.target.value) })}
                    className={small}
                  >
                    {VAT_RATES.map((r) => (
                      <option key={r} value={r}>
                        {r}%
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="text-right text-sm font-semibold">{euro(lineTotal(line))}</p>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            set("lines", [
              ...data.lines,
              { kind: "material", description: "", quantity: 1, unit: "stuk", unit_price: 0, vat_rate: 21 },
            ]);
            setKeys((k) => [...k, Math.max(-1, ...k) + 1]);
          }}
          className="mt-2 rounded-lg border border-dashed border-slate-400 px-3 py-2 text-sm"
        >
          + {t.addLine}
        </button>
      </div>

      <dl className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
        <div className="flex justify-between">
          <dt>{t.exclVat}</dt>
          <dd>{euro(sum.excl)}</dd>
        </div>
        {sum.vatLines.map((v) => (
          <div key={v.rate} className="flex justify-between text-slate-600">
            <dt>
              {t.vat} {v.rate}%
            </dt>
            <dd>{euro(v.vat)}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold">
          <dt>{t.total}</dt>
          <dd>{euro(sum.incl)}</dd>
        </div>
      </dl>

      <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
        <label className="block text-sm font-medium">
          {t.expires}
          <input
            type="date"
            value={data.valid_until ?? ""}
            onChange={(e) => set("valid_until", e.target.value || null)}
            className={field}
          />
        </label>
        <label className="block text-sm font-medium">
          {t.quoteTerms}
          <textarea
            value={data.terms ?? ""}
            onChange={(e) => set("terms", e.target.value)}
            rows={3}
            className={field}
          />
        </label>
      </div>

      <div className="sticky bottom-3 flex items-center gap-3">
        <button
          type="button"
          disabled={pending || !dirty}
          onClick={() =>
            startTransition(async () => {
              await saveQuote(quote.id, data);
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
