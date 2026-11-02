"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { lookupProduct, saveMaterialList } from "@/app/materials-actions";
import { itemTotal, listTotal, type MaterialItem } from "@/lib/materials";
import type { MaterialsDict } from "@/lib/materials-i18n";
import { euro } from "@/lib/orders";

// "29,99", "1.299,00" or "29.99" as typed on a phone.
const num = (v: string) => {
  const t = v.replace(/[€\s]/g, "");
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  return Number.isFinite(n) ? n : 0;
};

const input = "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base";

// The worker's list: paste shop links, adjust quantities, save.
export function MaterialsEditor({
  m,
  listId,
  initial,
}: {
  m: MaterialsDict;
  listId: string;
  initial: { title: string; client_name: string | null; items: MaterialItem[] };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [client, setClient] = useState(initial.client_name ?? "");
  const [items, setItems] = useState<MaterialItem[]>(initial.items);
  const [link, setLink] = useState("");
  const [fetching, setFetching] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [saved, setSaved] = useState<"idle" | "ok" | "error">("idle");
  const [pending, startTransition] = useTransition();

  const update = (id: string, patch: Partial<MaterialItem>) => {
    setSaved("idle");
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  async function addByLink() {
    // Shop apps share "Product name https://shop/…": take the link out of the text,
    // and keep the words as the name in case the shop page can't be read.
    const text = link.trim();
    if (!text) return;
    const found = text.match(/https?:\/\/[^\s<>"']+/i)?.[0]?.replace(/[),.;!?]+$/, "") ?? null;
    const words = (found ? text.replace(found, "") : text).replace(/\s+/g, " ").replace(/^[\s\-–—:|.,]+|[\s\-–—:|.,]+$/g, "");
    setNote(null);
    if (!found) {
      setItems((list) => [
        ...list,
        { id: crypto.randomUUID(), url: null, title: words.slice(0, 300), image: null, store: null, unit_price: 0, quantity: 1, unit: "st" },
      ]);
      setNote(m.fetchPartial);
      setLink("");
      setSaved("idle");
      return;
    }
    const url = found;
    setFetching(true);
    const info = await lookupProduct(url).catch(() => null);
    setFetching(false);
    setItems((list) => [
      ...list,
      {
        id: crypto.randomUUID(),
        url,
        title: info?.title || words.slice(0, 300) || "",
        image: info?.image ?? null,
        store: info?.store ?? null,
        unit_price: info?.price ?? 0,
        quantity: 1,
        unit: "st",
      },
    ]);
    if (!info?.title || !info?.price) setNote(m.fetchPartial);
    setLink("");
    setSaved("idle");
  }

  function addManual() {
    setItems((list) => [
      ...list,
      { id: crypto.randomUUID(), url: null, title: "", image: null, store: null, unit_price: 0, quantity: 1, unit: "st" },
    ]);
    setSaved("idle");
  }

  // Saves on its own a moment after each change, so the client link always shows the latest list.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => save(), 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, client, items]);

  function save() {
    startTransition(async () => {
      const res = await saveMaterialList(listId, { title, client_name: client, items }).catch(() => ({ ok: false }));
      setSaved(res.ok ? "ok" : "error");
      if (res.ok) router.refresh();
      setTimeout(() => setSaved((v) => (v === "ok" ? "idle" : v)), 2500);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">
          {m.titleLabel}
          <input value={title} onChange={(e) => { setTitle(e.target.value); setSaved("idle"); }} className={`mt-1 ${input}`} />
        </label>
        <label className="text-sm font-medium">
          {m.clientLabel}
          <input value={client} onChange={(e) => { setClient(e.target.value); setSaved("idle"); }} className={`mt-1 ${input}`} />
        </label>
      </div>

      <div>
        <p className="text-sm font-medium">🔗 {m.linkLabel}</p>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            inputMode="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addByLink();
              }
            }}
            placeholder={m.linkPlaceholder}
            className={`min-w-0 flex-1 ${input}`}
          />
          <button
            type="button"
            onClick={addByLink}
            disabled={fetching || !link.trim()}
            className="shrink-0 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {fetching ? m.fetching : m.add}
          </button>
        </div>
        {note && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{note}</p>}
      </div>

      {items.length === 0 ? (
        <p className="text-slate-600">{m.empty}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex gap-3">
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-2xl">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    "📦"
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <textarea
                    value={item.title}
                    onChange={(e) => update(item.id, { title: e.target.value })}
                    placeholder={m.itemTitle}
                    aria-label={m.itemTitle}
                    rows={2}
                    className={`${input} resize-none text-sm font-semibold`}
                  />
                  {(item.store || item.url) && (
                    <p className="truncate text-xs text-slate-500">
                      {item.store}
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-700 underline">
                          ↗
                        </a>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-[1fr_1fr_0.8fr] gap-2 text-xs text-slate-500">
                <label>
                  {m.price}
                  <input
                    inputMode="decimal"
                    defaultValue={item.unit_price ? String(item.unit_price).replace(".", ",") : ""}
                    onChange={(e) => update(item.id, { unit_price: num(e.target.value) })}
                    className={`mt-0.5 ${input} text-slate-900`}
                  />
                </label>
                <label>
                  {m.qty}
                  <input
                    inputMode="decimal"
                    defaultValue={String(item.quantity).replace(".", ",")}
                    onChange={(e) => update(item.id, { quantity: num(e.target.value) })}
                    className={`mt-0.5 ${input} text-slate-900`}
                  />
                </label>
                <label>
                  {m.unit}
                  <input
                    value={item.unit}
                    onChange={(e) => update(item.id, { unit: e.target.value })}
                    className={`mt-0.5 ${input} text-slate-900`}
                  />
                </label>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setItems((list) => list.filter((i) => i.id !== item.id));
                    setSaved("idle");
                  }}
                  className="text-red-700"
                >
                  {m.remove}
                </button>
                <span className="font-semibold">{euro(itemTotal(item))}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={addManual} className="rounded-lg border border-dashed border-slate-400 px-3 py-2 text-sm text-slate-700">
        {m.addManual}
      </button>

      <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-lg font-bold">
        <span>{m.total}</span>
        <span>{euro(listTotal(items))}</span>
      </div>
      <p className="text-xs text-slate-500">{m.priceHint}</p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-60"
        >
          {m.save}
        </button>
        {saved === "ok" && <span className="text-sm text-green-700">✓ {m.saved}</span>}
        {saved === "error" && <span className="text-sm text-red-700">{m.saveError}</span>}
      </div>
    </div>
  );
}
