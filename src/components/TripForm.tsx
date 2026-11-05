"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { estimateTrip, saveTrip } from "@/app/trips-actions";
import type { TripsDict } from "@/lib/trips-i18n";

export type Destination = { key: string; label: string; sub: string | null; query: string; orderId: string | null; icon: string };

const chip = (on: boolean) =>
  `rounded-full border px-3 py-2 text-sm ${on ? "border-orange-500 bg-orange-50 font-bold text-orange-800" : "border-slate-300 bg-white text-slate-700"}`;

// «＋ Поездка»: day, from, to and return as buttons; km are counted from the addresses and can be corrected.
export function TripForm({
  d,
  today,
  yesterday,
  homeLabel,
  destinations,
  startOpen,
}: {
  d: TripsDict;
  today: string;
  yesterday: string;
  homeLabel: string | null;
  destinations: Destination[];
  startOpen: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(startOpen);
  const [day, setDay] = useState(today);
  const [fromHome, setFromHome] = useState(!!homeLabel);
  const [fromText, setFromText] = useState("");
  const [dest, setDest] = useState<Destination | null>(null);
  const [toText, setToText] = useState("");
  const [round, setRound] = useState(true);
  const [km, setKm] = useState("");
  const [kmNote, setKmNote] = useState<string | null>(null);
  const [purpose, setPurpose] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typedKm = useRef(false);
  const ask = useRef(0);

  const toQuery = dest ? dest.query : toText.trim();
  const fromQuery = fromHome ? null : fromText.trim();

  // Counts the km again a moment after the route changes (unless the builder typed the km).
  useEffect(() => {
    if (!open || typedKm.current || toQuery.length < 2 || (!fromHome && (fromQuery ?? "").length < 2)) return;
    const n = ++ask.current;
    setKmNote(d.counting);
    const timer = setTimeout(async () => {
      const res = await estimateTrip({ from: fromQuery, to: toQuery, round });
      if (n !== ask.current || typedKm.current) return;
      if (res.ok) {
        setKm(String(res.km));
        setKmNote(`${res.byRoad ? d.byRoad : d.estimate} · ${d.fix}`);
      } else {
        setKmNote(d.notFound);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [open, toQuery, fromQuery, fromHome, round, d]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="w-full rounded-2xl bg-orange-600 px-4 py-3.5 text-center text-base font-extrabold text-white shadow-sm">
        {d.add}
      </button>
    );
  }

  async function save() {
    setError(null);
    const toLabel = dest ? (dest.sub ? `${dest.label}, ${dest.sub}` : dest.label) : toText.trim();
    if (!toLabel) return setError(d.needTo);
    const value = Number(km.replace(",", "."));
    if (!(value > 0)) return setError(d.needKm);
    setBusy(true);
    const res = await saveTrip({
      day,
      fromLabel: fromHome ? (homeLabel ?? d.home) : fromText.trim() || d.home,
      toLabel,
      round,
      km: value,
      purpose: purpose || (dest?.orderId ? dest.label : null),
      orderId: dest?.orderId ?? null,
    });
    setBusy(false);
    if (!res.ok) return setError(d.failed);
    setOpen(false);
    setDest(null);
    setToText("");
    setKm("");
    setKmNote(null);
    setPurpose("");
    typedKm.current = false;
    router.refresh();
  }

  const otherDay = day !== today && day !== yesterday;

  return (
    <section id="trip-form" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">{d.newTitle}</h2>

      <div>
        <p className="mb-1.5 text-sm text-slate-500">{d.when}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" className={chip(day === today)} onClick={() => setDay(today)}>
            {d.today}
          </button>
          <button type="button" className={chip(day === yesterday)} onClick={() => setDay(yesterday)}>
            {d.yesterday}
          </button>
          <label className={`${chip(otherDay)} relative`}>
            {otherDay ? day.split("-").reverse().join(".") : d.otherDay}
            <input type="date" value={day} max={today} onChange={(e) => e.target.value && setDay(e.target.value)} className="absolute inset-0 opacity-0" />
          </label>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm text-slate-500">{d.from}</p>
        <div className="flex flex-wrap gap-1.5">
          {homeLabel && (
            <button type="button" className={chip(fromHome)} onClick={() => setFromHome(true)}>
              🏠 {d.home} <span className="font-normal text-slate-500">{homeLabel}</span>
            </button>
          )}
          <button type="button" className={chip(!fromHome)} onClick={() => setFromHome(false)}>
            {d.otherAddress}
          </button>
        </div>
        {!fromHome && (
          <input value={fromText} onChange={(e) => setFromText(e.target.value)} placeholder={d.addressPh} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
        )}
      </div>

      <div>
        <p className="mb-1.5 text-sm text-slate-500">{d.to}</p>
        {destinations.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {destinations.map((x) => (
              <button
                key={x.key}
                type="button"
                className={chip(dest?.key === x.key)}
                onClick={() => {
                  typedKm.current = false;
                  setDest(dest?.key === x.key ? null : x);
                  setToText("");
                }}
              >
                {x.icon} {x.label} {x.sub && <span className="font-normal text-slate-500">{x.sub}</span>}
              </button>
            ))}
          </div>
        )}
        <input
          value={toText}
          onChange={(e) => {
            typedKm.current = false;
            setDest(null);
            setToText(e.target.value);
          }}
          placeholder={destinations.length ? d.toPh : d.addressPh}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
        />
      </div>

      <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
        <span>{d.roundTrip}</span>
        <input
          type="checkbox"
          checked={round}
          onChange={(e) => {
            const on = e.target.checked;
            setRound(on);
            // Typed km follow the switch: half or double.
            if (typedKm.current && Number(km) > 0) setKm(String(on ? Number(km) * 2 : Math.round((Number(km) / 2) * 10) / 10));
          }}
          className="h-6 w-6 accent-green-600"
        />
      </label>

      <div>
        <p className="mb-1.5 text-sm text-slate-500">{d.distance}</p>
        <div className="flex items-center gap-3 rounded-xl border-2 border-orange-500 px-3 py-2">
          <input
            value={km}
            onChange={(e) => {
              typedKm.current = true;
              setKm(e.target.value.replace(/[^\d.,]/g, ""));
              setKmNote(null);
            }}
            inputMode="decimal"
            className="w-24 text-2xl font-extrabold outline-none"
            placeholder="0"
          />
          <span className="text-lg font-bold">km</span>
          {kmNote && <span className="text-xs leading-tight text-slate-500">{kmNote}</span>}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm text-slate-500">{d.purpose}</span>
        <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder={d.purposePh} maxLength={200} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
      </label>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={busy} className="flex-1 rounded-xl bg-orange-600 px-4 py-3 font-bold text-white disabled:opacity-60">
          {busy ? d.saving : d.save}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-300 px-4 py-3 text-slate-700">
          {d.cancel}
        </button>
      </div>
    </section>
  );
}
