import Link from "next/link";
import { acceptTripHint, deleteOdometer, deleteTrip, saveCarType, saveTripHome, skipTripHint } from "@/app/trips-actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { OdometerForm } from "@/components/OdometerForm";
import { SubmitButton } from "@/components/SubmitButton";
import { TripForm, type Destination } from "@/components/TripForm";
import type { Lang } from "@/lib/i18n";
import { addDays, dutchToday } from "@/lib/quotes";
import { CAR_TYPES, KM_RATE, monthBounds, monthOf, odometerKm, toNum, type CarType, type OdometerReading, type Trip } from "@/lib/trips";
import { getTripsDict } from "@/lib/trips-i18n";
import { homePoint, tripHints, type TripProfile } from "@/lib/trips-server";
import { loadWorkspace } from "@/lib/workspace";

const LOCALES: Record<Lang, string> = { ru: "ru-RU", uk: "uk-UA", pl: "pl-PL", ro: "ro-RO", tr: "tr-TR", en: "en-GB", nl: "nl-NL" };
const card = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
const fmtKm = (n: number) => new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 1 }).format(n);

// «Поездки»: the month's business trips, suggested trips, odometer and the log for the tax office.
export default async function TripsPage({ searchParams }: { searchParams: Promise<{ m?: string; add?: string }> }) {
  const sp = await searchParams;
  const { supabase, user, profile, lang } = await loadWorkspace();
  const d = getTripsDict(lang);
  const today = dutchToday();
  const yesterday = addDays(-1);
  const month = monthOf(sp.m, today);
  const { start, next, nextMonth, prevMonth } = monthBounds(month);
  const isCurrent = month === today.slice(0, 7);
  const p = profile as TripProfile & { car_type?: CarType | null };
  const home = homePoint(p);

  const [{ data: tripRows }, { data: readingRows }, { data: orders }, { data: recent }] = await Promise.all([
    supabase.from("trips").select("*").eq("user_id", user.id).gte("day", start).lt("day", next).order("day", { ascending: false }).order("created_at", { ascending: false }).returns<Trip[]>(),
    supabase.from("odometer_readings").select("*").eq("user_id", user.id).order("read_on").returns<OdometerReading[]>(),
    supabase.from("orders").select("id, title, client_name, address").eq("user_id", user.id).eq("status", "open").not("address", "is", null).order("created_at", { ascending: false }).limit(8),
    supabase.from("trips").select("to_label").eq("user_id", user.id).is("order_id", null).gte("day", addDays(-90)).order("day", { ascending: false }).limit(40),
  ]);
  const trips = tripRows ?? [];
  const readings = readingRows ?? [];

  const hints = isCurrent
    ? await tripHints(
        supabase,
        user.id,
        p,
        (await supabase.from("trips").select("day, receipt_id, order_id").eq("user_id", user.id).gte("day", addDays(-10))).data ?? [],
      )
    : [];

  const workKm = trips.reduce((s, t) => s + toNum(t.km), 0);
  const workDays = new Set(trips.map((t) => t.day)).size;
  const car = p.car_type ?? null;
  const showMoney = car !== "business" && car !== "van_no_private";
  const odo = odometerKm(readings, month);
  const privateKm = odo.km !== null ? Math.max(0, odo.km - workKm) : null;

  const locale = LOCALES[lang];
  const monthName = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${start}T00:00:00Z`));
  const dayName = (day: string) =>
    day === today ? d.today : day === yesterday ? d.yesterday : new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

  const destinations: Destination[] = [
    ...(orders ?? []).map((o: { id: string; title: string; client_name: string | null; address: string | null }) => ({
      key: `o:${o.id}`,
      label: o.client_name || o.title,
      sub: (o.address ?? "").split(",").slice(-1)[0].trim() || null,
      query: o.address ?? "",
      orderId: o.id,
      icon: "👷",
    })),
    ...[...new Set((recent ?? []).map((r: { to_label: string }) => r.to_label))].slice(0, 6).map((label) => ({
      key: `r:${label}`,
      label,
      sub: null,
      query: label,
      orderId: null,
      icon: "📍",
    })),
  ];

  const byDay = new Map<string, Trip[]>();
  for (const t of trips) byDay.set(t.day, [...(byDay.get(t.day) ?? []), t]);

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">🚗 {d.title}</h1>
        <div className="flex items-center gap-1 text-sm">
          <Link href={`/dashboard/trips?m=${prevMonth}`} className="rounded-full border border-slate-200 bg-white px-2.5 py-1" aria-label="‹">
            ‹
          </Link>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold capitalize">{monthName}</span>
          {!isCurrent && (
            <Link href={`/dashboard/trips?m=${nextMonth}`} className="rounded-full border border-slate-200 bg-white px-2.5 py-1" aria-label="›">
              ›
            </Link>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-600">{d.intro}</p>

      <section className="flex items-end justify-between rounded-2xl bg-gradient-to-br from-orange-600 to-orange-800 px-4 py-4 text-white shadow-sm">
        <div>
          <p className="text-3xl font-extrabold">{d.km.replace("{n}", fmtKm(workKm))}</p>
          <p className="text-sm opacity-90">{d.workTrips.replace("{d}", String(workDays))}</p>
        </div>
        {showMoney && (
          <div className="rounded-xl bg-white/20 px-3 py-1.5 text-right text-xs">
            {d.deduct}
            <b className="block text-lg">≈ € {Math.round(workKm * KM_RATE)}</b>
          </div>
        )}
      </section>

      {!home && (
        <form action={saveTripHome} className={`${card} space-y-2 border-amber-200 bg-amber-50`}>
          <p className="font-semibold">{d.homeMissing}</p>
          <div className="flex gap-2">
            <input name="address" placeholder={d.addressPh} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2" />
            <SubmitButton className="rounded-lg bg-orange-600 px-3 py-2 font-semibold text-white disabled:opacity-60">{d.homeSave}</SubmitButton>
          </div>
        </form>
      )}

      {hints.map((h) => (
        <section key={h.key} className="rounded-2xl border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-900">
            {(h.kind === "order" ? d.hintOrder : d.hintReceipt)
              .replace("{day}", dayName(h.day))
              .replace("{client}", h.who)
              .replace("{store}", h.who)
              .replace("{route}", `${d.home} → ${h.toLabel} → ${d.home}`)
              .replace("{km}", fmtKm(h.km))}
          </p>
          <div className="mt-2 flex gap-2">
            <form action={acceptTripHint.bind(null, h.key, d.materials)} className="flex-1">
              <SubmitButton className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">{d.hintYes}</SubmitButton>
            </form>
            <form action={skipTripHint.bind(null, h.key)}>
              <SubmitButton className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 disabled:opacity-60">{d.hintNo}</SubmitButton>
            </form>
          </div>
        </section>
      ))}

      <TripForm d={d} today={today} yesterday={yesterday} homeLabel={home?.label ?? null} destinations={destinations} startOpen={sp.add === "1"} />

      {trips.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center text-slate-600">{d.empty}</p>}
      {[...byDay.entries()].map(([day, list]) => (
        <section key={day}>
          <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">{dayName(day)}</h2>
          <ul className="space-y-1.5">
            {list.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {t.from_label === home?.label ? d.home : t.from_label} → {t.to_label}
                    {t.round_trip ? ` → ${t.from_label === home?.label ? d.home : t.from_label}` : ""}
                  </p>
                  {t.purpose && <p className="truncate text-xs text-slate-500">{t.purpose}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <b className="whitespace-nowrap">{fmtKm(toNum(t.km))} km</b>
                  <form action={deleteTrip.bind(null, t.id)}>
                    <ConfirmButton message={d.delConfirm} className="px-1 text-slate-400 hover:text-red-600">
                      ✕
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className={`${card} space-y-3`}>
        <h2 className="font-bold">{d.odoTitle}</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: d.odoStart, r: odo.from },
            { label: d.odoEnd, r: odo.to && odo.to.id !== odo.from?.id ? odo.to : null },
          ].map(({ label, r }) => (
            <div key={label} className={`rounded-xl px-3 py-2 ${r ? "bg-slate-900 text-white" : "border-2 border-dashed border-slate-300 text-slate-400"}`}>
              <p className="text-[11px] opacity-80">
                {label}
                {r ? ` · ${r.read_on.split("-").reverse().join(".")}` : ""}
              </p>
              <p className="font-mono text-lg font-bold tracking-wider">{r ? new Intl.NumberFormat("nl-NL").format(r.km) : "—"}</p>
              {r && (
                <form action={deleteOdometer.bind(null, r.id)}>
                  <ConfirmButton message={d.delConfirm} className="text-[11px] text-slate-400 underline">
                    ✕
                  </ConfirmButton>
                </form>
              )}
            </div>
          ))}
        </div>
        {odo.km !== null ? <p className="text-sm text-slate-600">{d.odoMonth.replace("{n}", fmtKm(odo.km))}</p> : <p className="text-sm text-slate-500">{d.odoNeed}</p>}
        <OdometerForm d={d} userId={user.id} today={today} />
      </section>

      {privateKm !== null && odo.km !== null && (
        <section className={`${card} space-y-2`}>
          <h2 className="font-bold">{d.split}</h2>
          <div className="flex h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="bg-orange-500" style={{ width: `${Math.min(100, (workKm / odo.km) * 100)}%` }} />
          </div>
          <p className="flex justify-between text-sm">
            <span>🟧 {d.work}</span>
            <b>{fmtKm(workKm)} km</b>
          </p>
          <p className="flex justify-between text-sm">
            <span>⬜ {d.private}</span>
            <b>{fmtKm(privateKm)} km</b>
          </p>
          {showMoney && (
            <p className="flex justify-between border-t border-slate-100 pt-2 text-sm">
              <span>{d.deductLine.replace("{rate}", KM_RATE.toFixed(2).replace(".", ",")).replace("{km}", fmtKm(workKm))}</span>
              <b>€ {Math.round(workKm * KM_RATE)}</b>
            </p>
          )}
        </section>
      )}

      <section className={`${card} space-y-2`}>
        <h2 className="font-bold">{d.carTitle}</h2>
        <div className="flex flex-wrap gap-1.5">
          {CAR_TYPES.map((c) => (
            <form key={c} action={saveCarType.bind(null, c)}>
              <SubmitButton
                className={`rounded-lg border px-3 py-1.5 text-sm ${car === c ? "border-orange-500 bg-orange-50 font-bold text-orange-800" : "border-slate-300 bg-white text-slate-700"}`}
              >
                {d[`car_${c}`]}
              </SubmitButton>
            </form>
          ))}
        </div>
        <p className="text-xs text-slate-500">{car ? d[`carNote_${car}`] : d.carHint}</p>
      </section>

      {home && (
        <details className="text-sm text-slate-600">
          <summary className="cursor-pointer">
            🏠 {d.homeTitle}: {home.label}
          </summary>
          <form action={saveTripHome} className="mt-2 flex gap-2">
            <input name="address" defaultValue={p.trip_home ?? ""} placeholder={d.addressPh} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2" />
            <SubmitButton className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold disabled:opacity-60">{d.homeSave}</SubmitButton>
          </form>
          <p className="mt-1 text-xs text-slate-500">{d.homeHint}</p>
        </details>
      )}

      <Link href={`/dashboard/trips/report?m=${month}`} target="_blank" className="block rounded-2xl bg-orange-600 px-4 py-3.5 text-center font-extrabold text-white">
        {d.report}
      </Link>
      <p className="text-center text-xs text-slate-500">{d.reportHint}</p>
    </main>
  );
}
