"use client";

import { useState } from "react";

// 1–5 star picker that works as a normal form field (radio buttons named `name`).
export function StarInput({ name, label, big, required }: { name: string; label: string; big?: boolean; required?: boolean }) {
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset className={big ? "space-y-1" : "flex flex-wrap items-center justify-between gap-x-2"}>
      <legend className="sr-only">{label}</legend>
      <span aria-hidden="true" className={big ? "block font-semibold" : "text-sm text-slate-700"}>
        {label}
      </span>
      <div className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`cursor-pointer select-none px-0.5 leading-none ${big ? "text-4xl" : "text-2xl"}`} onMouseEnter={() => setHover(n)}>
            <input
              type="radio"
              name={name}
              value={n}
              required={required && n === 1}
              className="sr-only"
              checked={value === n}
              onChange={() => setValue(n)}
            />
            <span className={n <= shown ? "text-amber-500" : "text-slate-300"} aria-hidden="true">
              ★
            </span>
            <span className="sr-only">{n}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
