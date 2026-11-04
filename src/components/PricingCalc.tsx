"use client";

import { useState } from "react";

type Texts = { title: string; rate: string; hours: string; hourUnit: string; hoursUnit: string; time: string; cost: string; plus: string };

// Two sliders: the builder's rate and hours spent on paperwork; the gain updates at once.
export function PricingCalc({ t, price }: { t: Texts; price: number }) {
  const [rate, setRate] = useState(45);
  const [hours, setHours] = useState(8);
  const worth = rate * hours;
  const gain = worth - price;
  const slider = "w-full accent-orange-600";
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">{t.title}</h2>
      <label className="mt-4 block text-sm text-slate-600">
        <span className="flex justify-between">
          {t.rate}
          <b className="text-slate-900">
            {rate} {t.hourUnit}
          </b>
        </span>
        <input type="range" min={20} max={100} step={5} value={rate} onChange={(e) => setRate(Number(e.target.value))} className={slider} />
      </label>
      <label className="mt-3 block text-sm text-slate-600">
        <span className="flex justify-between">
          {t.hours}
          <b className="text-slate-900">
            {hours} {t.hoursUnit}
          </b>
        </span>
        <input type="range" min={1} max={30} value={hours} onChange={(e) => setHours(Number(e.target.value))} className={slider} />
      </label>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">{t.time}</p>
          <p className="mt-1 text-xl font-bold">{worth} €</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">{t.cost}</p>
          <p className="mt-1 text-xl font-bold">{price} €</p>
        </div>
        <div className={`rounded-xl p-3 ${gain > 0 ? "bg-green-50 text-green-800" : "bg-slate-50"}`}>
          <p className="text-xs">{t.plus}</p>
          <p className="mt-1 text-xl font-bold">
            {gain > 0 ? "+" : ""}
            {gain} €
          </p>
        </div>
      </div>
    </section>
  );
}
