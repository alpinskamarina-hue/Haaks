"use client";

import { useState, useTransition } from "react";
import { saveQuote } from "@/app/quotes-actions";
import type { Dict } from "@/lib/i18n";
import { euro } from "@/lib/orders";
import { LinesEditor } from "@/components/LinesEditor";
import { quoteTotals, type Quote } from "@/lib/quotes";

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
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof Editable>(key: K, value: Editable[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setDirty(true);
    setSaved(false);
    setSaveError(null);
  };
  const sum = quoteTotals(data.lines);
  const field = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2";

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

      <LinesEditor t={t} lines={data.lines} onChange={(lines) => set("lines", lines)} />

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

      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] flex items-center gap-3 lg:bottom-3">
        <button
          type="button"
          disabled={pending || !dirty}
          onClick={() =>
            startTransition(async () => {
              try {
                const result = await saveQuote(quote.id, data);
                if (!result.ok) return setSaveError(t.saveFailed);
                setDirty(false);
                setSaved(true);
              } catch (err) {
                // No connection or the session ran out: keep the edits on screen.
                console.error(err);
                setSaveError(t.saveFailed);
              }
            })
          }
          className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white shadow disabled:opacity-60"
        >
          {pending ? "…" : t.save}
        </button>
        {saved && <span className="text-sm text-green-700">✓ {t.saved}</span>}
        {saveError && <span className="rounded bg-white px-2 py-1 text-sm text-red-700">{saveError}</span>}
      </div>
    </div>
  );
}
