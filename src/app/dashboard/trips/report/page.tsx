import { PrintButton } from "@/components/PrintButton";
import { dutchToday } from "@/lib/quotes";
import { KM_RATE, monthBounds, monthOf, odometerKm, toNum, type CarType, type OdometerReading, type Trip } from "@/lib/trips";
import { loadWorkspace } from "@/lib/workspace";

const fmtKm = (n: number) => new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 1 }).format(n);
const nlDate = (day: string) => day.split("-").reverse().join("-");
const CAR: Record<CarType, string> = {
  private: "Privéauto (zakelijke km à € 0,23)",
  business: "Auto / bus van de zaak",
  van_no_private: "Bestelauto met verklaring geen privégebruik",
};

// The month's rittenregistratie in Dutch, to save as PDF or print for the accountant / Belastingdienst.
export default async function TripsReportPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const sp = await searchParams;
  const { supabase, user, profile } = await loadWorkspace();
  const month = monthOf(sp.m, dutchToday());
  const { start, next } = monthBounds(month);
  const [{ data: tripRows }, { data: readingRows }] = await Promise.all([
    supabase.from("trips").select("*").eq("user_id", user.id).gte("day", start).lt("day", next).order("day").order("created_at").returns<Trip[]>(),
    supabase.from("odometer_readings").select("*").eq("user_id", user.id).order("read_on").returns<OdometerReading[]>(),
  ]);
  const trips = tripRows ?? [];
  const workKm = trips.reduce((s, t) => s + toNum(t.km), 0);
  const odo = odometerKm(readingRows ?? [], month);
  const car = (profile as { car_type?: CarType | null }).car_type ?? null;
  const monthName = new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${start}T00:00:00Z`));
  const who = [profile.company_name, profile.full_name].filter(Boolean).join(" · ");
  const kvk = (profile as { kvk_number?: string | null }).kvk_number;

  return (
    <main className="mx-auto max-w-3xl space-y-5 bg-white px-6 py-8 text-slate-900 print:max-w-none print:px-0 print:py-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rittenregistratie</h1>
          <p className="text-slate-600 first-letter:uppercase">{monthName}</p>
        </div>
        <div className="text-right text-sm">
          {who && <p className="font-semibold">{who}</p>}
          {kvk && <p>KvK {kvk}</p>}
          {car && <p className="text-slate-600">{CAR[car]}</p>}
        </div>
      </div>

      <div className="-mx-6 overflow-x-auto px-6 print:mx-0 print:overflow-visible print:px-0">
      <table className="w-full min-w-[34rem] border-collapse text-xs sm:text-sm print:min-w-0">
        <thead>
          <tr className="border-b-2 border-slate-800 text-left">
            <th className="py-1.5 pr-2">Datum</th>
            <th className="py-1.5 pr-2">Van</th>
            <th className="py-1.5 pr-2">Naar</th>
            <th className="py-1.5 pr-2">Doel / klant</th>
            <th className="py-1.5 pr-2">H/T</th>
            <th className="py-1.5 text-right">Km</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((t) => (
            <tr key={t.id} className="border-b border-slate-200 align-top">
              <td className="whitespace-nowrap py-1.5 pr-2">{nlDate(t.day)}</td>
              <td className="py-1.5 pr-2">{t.from_label}</td>
              <td className="py-1.5 pr-2">{t.to_label}</td>
              <td className="py-1.5 pr-2">{t.purpose ?? ""}</td>
              <td className="py-1.5 pr-2">{t.round_trip ? "ja" : "nee"}</td>
              <td className="py-1.5 text-right">{fmtKm(toNum(t.km))}</td>
            </tr>
          ))}
          {trips.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-slate-500">
                Geen ritten in deze maand.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      <table className="ml-auto text-sm">
        <tbody>
          <tr>
            <td className="pr-6">Zakelijke kilometers</td>
            <td className="text-right font-bold">{fmtKm(workKm)} km</td>
          </tr>
          {odo.km !== null && odo.from && odo.to && (
            <>
              <tr>
                <td className="pr-6">
                  Kilometerstand {nlDate(odo.from.read_on)} → {nlDate(odo.to.read_on)}
                </td>
                <td className="text-right">
                  {new Intl.NumberFormat("nl-NL").format(odo.from.km)} → {new Intl.NumberFormat("nl-NL").format(odo.to.km)}
                </td>
              </tr>
              <tr>
                <td className="pr-6">Totaal gereden</td>
                <td className="text-right">{fmtKm(odo.km)} km</td>
              </tr>
              <tr>
                <td className="pr-6">Privé kilometers</td>
                <td className="text-right font-bold">{fmtKm(Math.max(0, odo.km - workKm))} km</td>
              </tr>
            </>
          )}
          {(car === "private" || !car) && (
            <tr className="border-t border-slate-300">
              <td className="pr-6 pt-1">Aftrekbaar (€ {KM_RATE.toFixed(2).replace(".", ",")} per km)</td>
              <td className="pt-1 text-right font-bold">€ {(workKm * KM_RATE).toFixed(2).replace(".", ",")}</td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="text-xs text-slate-500">Opgesteld met Haaks op {nlDate(dutchToday())}. Afstanden berekend via de weg of handmatig ingevuld.</p>
      <div className="print:hidden">
        <PrintButton label="Opslaan als PDF / printen" />
      </div>
    </main>
  );
}
