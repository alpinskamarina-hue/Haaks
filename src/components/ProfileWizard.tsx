"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveWorkerProfile, skipOnboarding } from "@/app/profile-actions";
import type { Lang } from "@/lib/i18n";
import {
  EQUIPMENT,
  LANG_LEVELS,
  LEVELS,
  LICENCES,
  NL_CITIES,
  RADII,
  SPOKEN,
  TOOLS,
  TRADES,
  VEHICLES,
  WORKS_WITH,
  type WorkerProfile,
} from "@/lib/worker-profile";
import { radiusText, yearsText, type WorkerDict } from "@/lib/worker-profile-text";

type Step = 0 | 1 | 2 | 3 | 4; // 0 = name and phone (required)

const chipOn = "border-2 border-orange-600 bg-orange-50 font-semibold text-orange-700";
const chipOff = "border border-slate-300 bg-white text-slate-800";
const card = "rounded-xl border border-slate-200 bg-white p-4";

function Segmented<T extends string>({
  options,
  value,
  label,
  onChange,
}: {
  options: readonly T[];
  value: T | null | undefined;
  label: (v: T) => string;
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="mt-2 grid gap-1 rounded-lg bg-slate-100 p-1 text-center text-sm"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`rounded-md py-2 ${value === o ? "bg-white font-semibold text-orange-700 shadow-sm" : "text-slate-600"}`}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

function Choice<T extends string | number>({
  options,
  value,
  label,
  onChange,
  cols,
}: {
  options: readonly T[];
  value: T | null | undefined;
  label: (v: T) => string;
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div
      className="mt-2 grid gap-1.5 text-center text-sm"
      style={{ gridTemplateColumns: `repeat(${cols ?? options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`rounded-lg px-1 py-2 leading-tight ${value === o ? chipOn : chipOff}`}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

function toggle<T>(list: T[], v: T) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

// Four short sign-up questions, also used to change one part later (edit).
export function ProfileWizard({
  w,
  lang,
  initial,
  startStep,
  edit,
  must = false,
  backTo = "/dashboard/profile",
  contact,
  staffSlot,
}: {
  w: WorkerDict;
  lang: Lang;
  initial: WorkerProfile;
  startStep: Step;
  edit: boolean;
  must?: boolean; // name/phone missing after sign-up: no way around this step
  backTo?: string; // where an edit returns: profile or settings
  contact: { firstName: string; lastName: string; phone: string };
  staffSlot?: React.ReactNode; // first sign-up screen: «Заполнить с сотрудником»
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(startStep);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(contact.firstName);
  const [lastName, setLastName] = useState(contact.lastName);
  const [phone, setPhone] = useState(contact.phone);
  const [trades, setTrades] = useState<string[]>(initial.trades);
  const [tradeLevels, setTradeLevels] = useState(initial.trade_levels ?? {});
  const [city, setCity] = useState(initial.city ?? "");
  const [travel, setTravel] = useState<number | null>(initial.travel_km);
  const [extra, setExtra] = useState<string[]>(initial.extra_cities);
  const [newCity, setNewCity] = useState("");
  const [languages, setLanguages] = useState<string[]>(initial.languages);
  const [langLevels, setLangLevels] = useState<Record<string, string>>(initial.language_levels ?? {});
  const [vehicle, setVehicle] = useState(initial.vehicle);
  const [licences, setLicences] = useState<string[]>(initial.licences);
  const [tools, setTools] = useState(initial.tools);
  const [equipment, setEquipment] = useState<string[]>(initial.equipment);
  const [worksWith, setWorksWith] = useState(initial.works_with);
  const [teamSize, setTeamSize] = useState(initial.team_size ? String(initial.team_size) : "");

  function stepData(s: Step): Record<string, unknown> {
    if (s === 0) return { full_name: `${firstName.trim()} ${lastName.trim()}`, phone };
    if (s === 1) return { trades, trade_levels: tradeLevels };
    if (s === 2) return { city, travel_km: travel, extra_cities: extra };
    if (s === 3) return { languages, language_levels: langLevels };
    return { vehicle, licences: vehicle === "none" ? [] : licences, tools, equipment, works_with: worksWith, team_size: teamSize };
  }

  function go(next: Step | "done") {
    setError(null);
    if (step === 0 && (!firstName.trim() || !lastName.trim() || phone.replace(/\D/g, "").length < 8)) {
      setError(w.s0Need);
      return;
    }
    if (step === 1 && trades.length === 0) {
      setError(w.s1Pick);
      return;
    }
    startTransition(async () => {
      const res = await saveWorkerProfile(stepData(step), { finish: next === "done" && !edit });
      if (!res.ok) {
        setError(w.saveError);
        return;
      }
      if (next === "done") {
        router.push(edit && !must ? backTo : "/dashboard");
        router.refresh();
      } else {
        setStep(next);
        window.scrollTo(0, 0);
      }
    });
  }

  function later() {
    startTransition(async () => {
      await skipOnboarding();
      router.push("/dashboard");
      router.refresh();
    });
  }

  function addCity() {
    const c = newCity.trim();
    if (c && !extra.includes(c) && extra.length < 10) setExtra([...extra, c]);
    setNewCity("");
  }

  const primary =
    "w-full rounded-xl bg-orange-600 py-3.5 text-lg font-semibold text-white shadow-[0_4px_0_#9a3412] disabled:opacity-60";

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 text-sm">
        {must ? (
          <span />
        ) : edit ? (
          <button type="button" onClick={() => router.push(backTo)} className="text-slate-500">
            ← {w.back}
          </button>
        ) : step > 0 ? (
          <button type="button" onClick={() => setStep((step - 1) as Step)} className="text-slate-500">
            ← {w.back}
          </button>
        ) : (
          <span />
        )}
        {!edit && <span className="font-medium">{w.step.replace("{n}", String(step + 1))}</span>}
        {!edit && step > 0 ? (
          <button type="button" onClick={later} disabled={pending} className="text-slate-500">
            {w.later}
          </button>
        ) : (
          <span />
        )}
      </header>
      {!edit && (
        <div className="h-1.5 bg-slate-200">
          <div className="h-1.5 bg-orange-600 transition-all" style={{ width: `${(step + 1) * 20}%` }} />
        </div>
      )}

      <div className="space-y-5 px-4 py-6">
        {step === 0 && (
          <>
            <div>
              <h1 className="text-2xl font-bold">{w.s0Title}</h1>
              <p className="mt-1 text-slate-600">{w.s0Hint}</p>
            </div>
            {!edit && staffSlot}
            <label className="block text-sm font-medium">
              {w.firstName}
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base"
              />
            </label>
            <label className="block text-sm font-medium">
              {w.lastName}
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base"
              />
            </label>
            <label className="block text-sm font-medium">
              {w.phoneLabel}
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                placeholder={w.phoneHint}
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base"
              />
            </label>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-bold">{w.s1Title}</h1>
              <p className="mt-1 text-slate-600">{w.s1Hint}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[15px]">
              {TRADES.map((id) => {
                const on = trades.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setTrades(toggle(trades, id))}
                    className={`rounded-full px-3 py-2 ${on ? chipOn : chipOff}`}
                  >
                    {on && "✓ "}
                    {w.trades[id]}
                  </button>
                );
              })}
            </div>
            {trades.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">{w.levelTitle}</p>
                {trades.map((id) => {
                  const cur = tradeLevels[id] ?? {};
                  return (
                    <div key={id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{w.trades[id as keyof typeof w.trades]}</span>
                        <label className="flex items-center gap-2 text-sm text-slate-500">
                          {w.yearsLabel}
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={60}
                            value={cur.years ?? ""}
                            onChange={(e) =>
                              setTradeLevels({
                                ...tradeLevels,
                                [id]: { ...cur, years: e.target.value === "" ? null : Number(e.target.value) },
                              })
                            }
                            className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-base text-slate-900"
                          />
                        </label>
                      </div>
                      <Segmented
                        options={LEVELS}
                        value={cur.level as (typeof LEVELS)[number] | undefined}
                        label={(v) => w.levels[v]}
                        onChange={(v) => setTradeLevels({ ...tradeLevels, [id]: { ...cur, level: v } })}
                      />
                      {cur.years ? <p className="mt-1 text-right text-xs text-slate-500">{yearsText(w, lang, cur.years)}</p> : null}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h1 className="text-2xl font-bold">{w.s2Title}</h1>
              <p className="mt-1 text-slate-600">{w.s2Hint}</p>
            </div>
            <datalist id="nl-cities">
              {NL_CITIES.map(([c]) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <label className="block text-sm font-medium">
              {w.livesIn}
              <input
                list="nl-cities"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={w.cityPlaceholder}
                autoComplete="address-level2"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base"
              />
            </label>
            {city.trim() && travel !== null && (
              <div className="relative h-40 overflow-hidden rounded-xl border border-slate-200 bg-[#e8efe6]">
                <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(#d4dfd2_1px,transparent_1px),linear-gradient(90deg,#d4dfd2_1px,transparent_1px)] [background-size:28px_28px]" />
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-orange-500 bg-orange-500/15 transition-all"
                  style={{ width: travel === 0 ? 600 : 40 + travel * 1.6, height: travel === 0 ? 600 : 40 + travel * 1.6 }}
                />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="mx-auto h-3 w-3 rounded-full bg-orange-600 ring-4 ring-white" />
                  <p className="mt-1 text-xs font-semibold">{city}</p>
                </div>
                <span className="absolute bottom-3 right-3 rounded bg-white/90 px-2 py-0.5 text-xs font-semibold text-orange-700">
                  {radiusText(w, travel)}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{w.travel}</p>
              <Choice options={RADII} value={travel} label={(km) => radiusText(w, km)} onChange={setTravel} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">
                {w.extraCities} <span className="font-normal text-slate-500">{w.optional}</span>
              </p>
              <div className="flex flex-wrap gap-2 text-sm">
                {extra.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setExtra(extra.filter((x) => x !== c))}
                    className="rounded-full bg-slate-900 px-3 py-1.5 text-white"
                  >
                    {c} ✕
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  list="nl-cities"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCity();
                    }
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
                />
                <button type="button" onClick={addCity} className="rounded-lg border border-dashed border-slate-400 bg-white px-3 py-2 text-sm text-slate-700">
                  + {w.addCity}
                </button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h1 className="text-2xl font-bold">{w.s3Title}</h1>
              <p className="mt-1 text-slate-600">{w.s3Hint}</p>
            </div>
            <div className="space-y-2">
              {languages.map((id) => (
                <div key={id} className="rounded-xl border-2 border-orange-600 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{w.spoken[id as keyof typeof w.spoken]}</span>
                    <button
                      type="button"
                      onClick={() => setLanguages(languages.filter((x) => x !== id))}
                      className="px-2 text-slate-400"
                      aria-label="✕"
                    >
                      ✕
                    </button>
                  </div>
                  <Segmented
                    options={LANG_LEVELS}
                    value={(langLevels[id] as (typeof LANG_LEVELS)[number]) ?? "basic"}
                    label={(v) => w.langLevels[v]}
                    onChange={(v) => setLangLevels({ ...langLevels, [id]: v })}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 text-[15px]">
              {SPOKEN.filter((id) => !languages.includes(id)).map((id) => (
                <button key={id} type="button" onClick={() => setLanguages([...languages, id])} className={`rounded-full px-3 py-2 ${chipOff}`}>
                  + {w.spoken[id]}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div>
              <h1 className="text-2xl font-bold">{w.s4Title}</h1>
              <p className="mt-1 text-slate-600">{w.s4Hint}</p>
            </div>
            <div className={card}>
              <p className="font-semibold">🚐 {w.vehicleTitle}</p>
              <Choice options={VEHICLES} value={vehicle as (typeof VEHICLES)[number] | null} label={(v) => w.vehicle[v]} onChange={setVehicle} />
              {vehicle && vehicle !== "none" && (
                <>
                  <p className="mt-3 text-sm font-medium">{w.licencesTitle}</p>
                  <div className="mt-1 flex gap-1.5 text-sm">
                    {LICENCES.map((l) => (
                      <button
                        key={l}
                        type="button"
                        aria-pressed={licences.includes(l)}
                        onClick={() => setLicences(toggle(licences, l))}
                        className={`rounded-lg px-4 py-1.5 ${licences.includes(l) ? chipOn : chipOff}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className={card}>
              <p className="font-semibold">🧰 {w.toolsTitle}</p>
              <Choice options={TOOLS} value={tools as (typeof TOOLS)[number] | null} label={(v) => w.tools[v]} onChange={setTools} />
              <p className="mt-3 text-sm font-medium">{w.equipmentTitle}</p>
              <div className="mt-1 flex flex-wrap gap-1.5 text-sm">
                {EQUIPMENT.map((e) => (
                  <button
                    key={e}
                    type="button"
                    aria-pressed={equipment.includes(e)}
                    onClick={() => setEquipment(toggle(equipment, e))}
                    className={`rounded-full px-3 py-1 ${equipment.includes(e) ? chipOn : chipOff}`}
                  >
                    {equipment.includes(e) && "✓ "}
                    {w.equipment[e]}
                  </button>
                ))}
              </div>
            </div>
            <div className={card}>
              <p className="font-semibold">👷 {w.worksTitle}</p>
              <Choice options={WORKS_WITH} value={worksWith as (typeof WORKS_WITH)[number] | null} label={(v) => w.worksWith[v]} onChange={setWorksWith} />
              {worksWith === "team" && (
                <label className="mt-3 flex items-center justify-between gap-3 text-sm font-medium">
                  {w.teamSize}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={2}
                    max={100}
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-base"
                  />
                </label>
              )}
            </div>
          </>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="button"
          disabled={pending}
          onClick={() => go(edit || step === 4 ? "done" : ((step + 1) as Step))}
          className={primary}
        >
          {edit ? w.saveChanges : step === 4 ? w.finish : w.next}
        </button>
        {!edit && step === 4 && <p className="text-center text-sm text-slate-500">{w.laterHint}</p>}
      </div>
    </div>
  );
}
