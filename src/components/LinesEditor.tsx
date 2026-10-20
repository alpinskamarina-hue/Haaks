"use client";

import { useState } from "react";
import type { Dict } from "@/lib/i18n";
import { euro } from "@/lib/orders";
import { LINE_KINDS, lineTotal, parseAmount, VAT_RATES, type QuoteLine } from "@/lib/quotes";

// Editable work/material lines, shared by quotes and invoices.
export function LinesEditor({
  t,
  lines,
  onChange,
  showVat = true,
}: {
  t: Dict;
  lines: QuoteLine[];
  onChange: (lines: QuoteLine[]) => void;
  showVat?: boolean;
}) {
  // Stable keys so the number inputs keep their text when a line above is removed.
  const [keys, setKeys] = useState(() => lines.map((_, i) => i));
  const setLine = (i: number, patch: Partial<QuoteLine>) =>
    onChange(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const kindLabel = { labour: t.kindLabour, material: t.kindMaterial, other: t.kindOther };
  const small = "w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm";
  const num = (v: string) => parseAmount(v) || 0;

  return (
    <div>
      <h3 className="mb-2 font-semibold">{t.quoteLines}</h3>
      <ul className="space-y-3">
        {lines.map((line, i) => (
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
                  onChange(lines.filter((_, j) => j !== i));
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
            <div
              className={`grid items-end gap-2 text-xs text-slate-500 ${showVat ? "grid-cols-[1fr_1fr_1.3fr_1fr]" : "grid-cols-[1fr_1fr_1.3fr]"}`}
            >
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
              {showVat && (
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
              )}
            </div>
            <p className="text-right text-sm font-semibold">{euro(lineTotal(line))}</p>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          onChange([
            ...lines,
            { kind: "material", description: "", quantity: 1, unit: "stuk", unit_price: 0, vat_rate: 21 },
          ]);
          setKeys((k) => [...k, Math.max(-1, ...k) + 1]);
        }}
        className="mt-2 rounded-lg border border-dashed border-slate-400 px-3 py-2 text-sm"
      >
        + {t.addLine}
      </button>
    </div>
  );
}
