"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { deleteStoreCard, saveStoreCard } from "@/app/cards-actions";
import type { CardsDict } from "@/lib/cards-i18n";
import { prepareUpload } from "@/lib/prepare-upload";
import type { CardFormat } from "@/lib/store-cards";
import { createClient } from "@/lib/supabase/client";

export type ShownCard = { id: string; store: string; customName: string | null; name: string; color: string; number: string; format: CardFormat; svg: string; photoUrl: string | null };
type Store = { key: string; name: string; color: string };

const dark = (color: string) => `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 62%, black))`;
const masked = (n: string) => `•••• ${n.replace(/\s/g, "").slice(-4)}`;

// The list of store cards, the full-screen card for the till, and the form to add a card from a photo.
export function StoreCards({
  cards,
  stores,
  d,
  userId,
  openId,
  startAdding,
}: {
  cards: ShownCard[];
  stores: Store[];
  d: CardsDict;
  userId: string;
  openId: string | null;
  startAdding: boolean;
}) {
  const [open, setOpen] = useState<number | null>(() => {
    const i = openId ? cards.findIndex((c) => c.id === openId) : -1;
    return i >= 0 ? i : null;
  });
  const [adding, setAdding] = useState(startAdding || false);
  const [editing, setEditing] = useState<ShownCard | null>(null);

  // The page is kept by the service worker, so the cards open at the till without internet.
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">💳 {d.title}</h1>
      </div>
      <p className="text-slate-600">{d.intro}</p>

      {cards.length === 0 && !adding && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">{d.empty}</p>
      )}

      <ul className="space-y-3">
        {cards.map((c, i) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="flex min-h-[84px] w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-white shadow-sm"
              style={{ background: dark(c.color) }}
            >
              <span>
                <span className="block text-lg font-extrabold">{c.name}</span>
                <span className="mt-0.5 block text-sm tracking-widest opacity-85">{masked(c.number)}</span>
              </span>
              <span className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-bold">{d.show}</span>
            </button>
          </li>
        ))}
      </ul>

      {editing ? (
        <AddCard key={editing.id} initial={editing} stores={stores} d={d} userId={userId} onDone={() => setEditing(null)} />
      ) : adding ? (
        <AddCard stores={stores} d={d} userId={userId} onDone={() => setAdding(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-center font-bold text-orange-600 hover:border-orange-300"
        >
          ＋ {d.add}
        </button>
      )}
      <p className="text-sm text-slate-500">{d.note}</p>

      {open !== null && cards.length > 0 && <Viewer
          cards={cards}
          start={Math.min(open, cards.length - 1)}
          d={d}
          onClose={() => setOpen(null)}
          onEdit={(c) => {
            setAdding(false);
            setEditing(c);
            setTimeout(() => document.getElementById("card-form")?.scrollIntoView({ behavior: "smooth" }), 50);
          }}
        />}
    </>
  );
}

// Full screen: one card per slide, swipe for the next one. Keeps the screen awake while open.
function Viewer({
  cards,
  start,
  d,
  onClose,
  onEdit,
}: {
  cards: ShownCard[];
  start: number;
  d: CardsDict;
  onClose: () => void;
  onEdit: (card: ShownCard) => void;
}) {
  const router = useRouter();
  const strip = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(start);
  const [photo, setPhoto] = useState(false);

  useEffect(() => {
    const el = strip.current;
    if (el) el.scrollLeft = start * el.clientWidth;
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    // The phone's back button closes the card instead of leaving the page.
    history.pushState({ card: true }, "");
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    const body = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      lock?.release().catch(() => {});
      window.removeEventListener("popstate", onPop);
      document.body.style.overflow = body;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => history.back();

  async function remove(id: string) {
    if (!confirm(d.delConfirm)) return;
    const res = await deleteStoreCard(id);
    if (res.ok) {
      close();
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" role="dialog" aria-modal="true">
      <div
        ref={strip}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: "none" }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / el.clientWidth);
          if (i !== at) {
            setAt(i);
            setPhoto(false);
          }
        }}
      >
        {cards.map((c) => (
          <section key={c.id} className="flex w-full shrink-0 snap-center flex-col">
            <header className="flex items-center justify-between px-5 py-4 text-white" style={{ background: c.color }}>
              <b className="text-2xl">{c.name}</b>
              <button type="button" onClick={close} aria-label={d.close} className="px-2 text-2xl leading-none">
                ✕
              </button>
            </header>
            <div className="flex flex-1 flex-col items-center overflow-y-auto px-5 pt-8">
              {photo ? (
                c.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photoUrl} alt={d.cardPhoto} className="max-h-[55vh] w-full rounded-xl object-contain" />
                ) : (
                  <p className="py-16 text-slate-500">{d.noPhoto}</p>
                )
              ) : (
                <>
                  <div
                    className={c.format === "qr" ? "aspect-square w-64 [&>svg]:h-full [&>svg]:w-full" : "h-44 w-full max-w-md"}
                    dangerouslySetInnerHTML={{ __html: c.svg }}
                  />
                  <p className="mt-3 break-all text-center font-mono text-2xl font-bold tracking-[0.2em]">{c.number}</p>
                  <p className="mt-3 max-w-xs text-center text-sm text-slate-500">{d.hint}</p>
                </>
              )}
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPhoto(false)}
                  className={`rounded-full px-4 py-2 text-sm ${!photo ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700"}`}
                >
                  {d.barcode}
                </button>
                <button
                  type="button"
                  onClick={() => setPhoto(true)}
                  className={`rounded-full px-4 py-2 text-sm ${photo ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700"}`}
                >
                  {d.cardPhoto}
                </button>
              </div>
              <div className="mt-8 flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onEdit(c);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  {d.edit}
                </button>
                <button type="button" onClick={() => remove(c.id)} className="text-sm text-slate-400 underline">
                  {d.del}
                </button>
              </div>
            </div>
          </section>
        ))}
      </div>
      {cards.length > 1 && (
        <div className="flex justify-center gap-1.5 pt-2">
          {cards.map((c, i) => (
            <span key={c.id} className={`h-2 w-2 rounded-full ${i === at ? "bg-slate-800" : "bg-slate-300"}`} />
          ))}
        </div>
      )}
      <p className="mx-4 mb-4 mt-3 rounded-xl bg-slate-100 px-3 py-2 text-center text-xs text-slate-600">{d.swipe}</p>
    </div>
  );
}

type Detector = { detect: (img: ImageBitmap) => Promise<{ rawValue: string; format: string }[]> };

// Add a card: photo -> the phone reads the barcode (Chrome on Android can) -> pick the store -> save.
function AddCard({
  initial,
  stores,
  d,
  userId,
  onDone,
}: {
  initial?: ShownCard;
  stores: Store[];
  d: CardsDict;
  userId: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.photoUrl ?? null);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [store, setStore] = useState(initial?.store ?? stores[0]?.key ?? "other");
  const [customName, setCustomName] = useState(initial?.customName ?? "");
  const [number, setNumber] = useState(initial?.number ?? "");
  // An unchanged QR card stays a QR code.
  const [detected, setDetected] = useState<string | null>(initial?.format === "qr" ? "qr_code" : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(f: File | undefined) {
    if (!f) return;
    setFile(f);
    setPreview((old) => {
      if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
    const Det = (window as unknown as { BarcodeDetector?: new () => Detector }).BarcodeDetector;
    if (!Det) return setStatus({ text: d.noDetector, ok: false });
    setStatus({ text: d.reading, ok: true });
    try {
      const found = await new Det().detect(await createImageBitmap(f));
      const best = found.find((x) => x.rawValue) ?? null;
      if (!best) return setStatus({ text: d.notFound, ok: false });
      setNumber(best.rawValue);
      setDetected(best.format);
      setStatus({ text: d.found.replace("{n}", best.rawValue), ok: true });
    } catch {
      setStatus({ text: d.notFound, ok: false });
    }
  }

  async function save() {
    setError(null);
    if (!number.trim()) return setError(d.needNumber);
    if (store === "other" && !customName.trim()) return setError(d.needName);
    setBusy(true);
    const supabase = createClient();
    let photoPath: string | null = null;
    try {
      if (file) {
        const prepared = await prepareUpload(file);
        if (!("error" in prepared) && prepared.mimeType !== "application/pdf") {
          const path = `${userId}/cards/${crypto.randomUUID()}.${prepared.ext}`;
          const { error: upErr } = await supabase.storage.from("documents").upload(path, prepared.file, { contentType: prepared.mimeType });
          if (!upErr) photoPath = path;
        }
      }
      const res = await saveStoreCard({ id: initial?.id ?? null, store, customName, number, detected, photoPath });
      if (!res.ok) throw new Error("save");
      router.refresh();
      onDone();
    } catch {
      if (photoPath) await supabase.storage.from("documents").remove([photoPath]);
      setError(d.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="card-form" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">{initial ? d.editTitle : d.newTitle}</h2>

      <label className="block cursor-pointer">
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="max-h-56 w-full rounded-xl bg-slate-900 object-contain" />
        ) : null}
        <span className="mt-2 block rounded-xl bg-slate-900 px-4 py-3 text-center font-semibold text-white">{preview ? d.photoAgain : d.photo}</span>
      </label>
      {status && (
        <p className={`rounded-lg px-3 py-2 text-sm font-medium ${status.ok ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>{status.text}</p>
      )}

      <div>
        <p className="mb-1.5 text-sm text-slate-500">{d.store}</p>
        <div className="flex flex-wrap gap-1.5">
          {[...stores, { key: "other", name: d.other, color: "#475569" }].map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStore(s.key)}
              className={`rounded-full border px-3 py-1.5 text-sm ${store === s.key ? "font-bold text-white" : "border-slate-300 bg-white text-slate-700"}`}
              style={store === s.key ? { background: s.color, borderColor: s.color } : undefined}
            >
              {s.name}
            </button>
          ))}
        </div>
        {store === "other" && (
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={d.otherName}
            maxLength={60}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5"
          />
        )}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm text-slate-500">
          {d.number} · {d.numberHint}
        </span>
        <input
          value={number}
          onChange={(e) => {
            setNumber(e.target.value);
            setDetected(null);
          }}
          inputMode="text"
          maxLength={120}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-mono text-lg tracking-wider"
        />
      </label>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={busy} className="flex-1 rounded-xl bg-orange-600 px-4 py-3 font-bold text-white disabled:opacity-60">
          {busy ? d.saving : d.save}
        </button>
        <button type="button" onClick={onDone} className="rounded-xl border border-slate-300 px-4 py-3 text-slate-700">
          {d.cancel}
        </button>
      </div>
    </section>
  );
}
