"use client";

import { useState, useTransition } from "react";
import { saveAbout, setAvailabilityState } from "@/app/profile-actions";
import { SubmitButton } from "@/components/SubmitButton";
import {
  aboutText,
  EXPERIENCE,
  STRENGTHS,
  type AboutDict,
  type AboutFacts,
  type Experience,
  type Strength,
} from "@/lib/profile-about";

const chip = "rounded-full border px-3 py-1.5 text-sm font-semibold";
const on = "border-slate-900 bg-slate-900 text-white";
const off = "border-slate-300 bg-white text-slate-700";

// «О себе»: pick experience and strengths, the Dutch text builds itself; the builder may change words.
export function AboutForm({
  a,
  nl,
  mine,
  initial,
}: {
  a: AboutDict;
  nl: AboutFacts;
  mine: AboutFacts | null; // the same facts in the builder's language, for the translation line
  initial: { exp: Experience | null; strengths: Strength[]; about: string | null };
}) {
  const [exp, setExp] = useState<Experience | null>(initial.exp);
  const [strengths, setStrengths] = useState<Strength[]>(initial.strengths);
  const built = aboutText(nl, exp, strengths);
  const [own, setOwn] = useState<string | null>(
    initial.about && initial.about !== aboutText(nl, initial.exp, initial.strengths) ? initial.about : null,
  );
  const text = own ?? built;

  return (
    <form action={saveAbout} className="space-y-3">
      <input type="hidden" name="experience_years" value={exp ?? ""} />
      <input type="hidden" name="strengths" value={strengths.join(",")} />
      <div>
        <p className="text-sm font-semibold text-slate-700">{a.expLabel}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {EXPERIENCE.map((n) => (
            <button key={n} type="button" onClick={() => setExp(exp === n ? null : n)} className={`${chip} ${exp === n ? on : off}`}>
              {a.exp[n]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">{a.strengthsLabel}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {STRENGTHS.map((s) => {
            const picked = strengths.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStrengths(picked ? strengths.filter((x) => x !== s) : [...strengths, s])}
                className={`${chip} ${picked ? on : off}`}
              >
                {a.strengths[s]}
              </button>
            );
          })}
        </div>
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">{a.textLabel}</span>
        <textarea
          name="about"
          lang="nl"
          rows={6}
          maxLength={600}
          value={text}
          onChange={(e) => setOwn(e.target.value)}
          className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-base leading-snug"
        />
      </label>
      {own !== null ? (
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
          {mine && a.edited}
          <button type="button" onClick={() => setOwn(null)} className="font-semibold text-orange-700 underline">
            {a.rebuild}
          </button>
        </p>
      ) : (
        mine && (
          <p className="text-xs text-slate-500">
            🔁 {a.meaning} «{aboutText(mine, exp, strengths)}»
          </p>
        )
      )}
      <SubmitButton className="w-full rounded-xl bg-orange-600 py-2.5 font-bold text-white disabled:opacity-60">{a.save}</SubmitButton>
    </form>
  );
}

// «Сейчас»: three chips, saved on tap. «Свободен с…» asks for the date.
export function AvailabilityNow({ a, state, from }: { a: AboutDict; state: "free" | "from" | "busy"; from: string | null }) {
  const [current, setCurrent] = useState(state);
  const [date, setDate] = useState(from ?? "");
  const [pending, start] = useTransition();
  const pick = (s: "free" | "from" | "busy") => {
    setCurrent(s);
    if (s !== "from") start(() => setAvailabilityState(s));
    else if (date) start(() => setAvailabilityState("from", date));
  };
  const color = { free: "border-green-600 bg-green-600 text-white", from: "border-amber-500 bg-amber-500 text-white", busy: "border-red-600 bg-red-600 text-white" };
  return (
    <div className={pending ? "opacity-70" : ""}>
      <div className="flex flex-wrap gap-1.5">
        {(["free", "from", "busy"] as const).map((s) => (
          <button key={s} type="button" onClick={() => pick(s)} className={`${chip} ${current === s ? color[s] : off}`}>
            {s === "free" ? a.free : s === "from" ? a.freeFrom : a.busy}
          </button>
        ))}
      </div>
      {current === "from" && (
        <label className="mt-2 block text-sm font-medium">
          {a.fromLabel}
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (e.target.value) start(() => setAvailabilityState("from", e.target.value));
            }}
            className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-base"
          />
        </label>
      )}
      <p className="mt-2 text-xs text-slate-500">{a.nowHint}</p>
    </div>
  );
}
