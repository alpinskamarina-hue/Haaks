// «Поездки»: the km log (rittenregistratie). Places come from PDOK (free, Dutch government),
// road distance from the public OSRM router; when that is not reachable, the straight line × 1.3.

export type Trip = {
  id: string;
  user_id: string;
  day: string;
  from_label: string;
  to_label: string;
  round_trip: boolean;
  km: number | string;
  purpose: string | null;
  order_id: string | null;
  receipt_id: string | null;
  created_at: string;
};

export type OdometerReading = { id: string; user_id: string; read_on: string; km: number; photo_path: string | null; created_at: string };

export type CarType = "private" | "business" | "van_no_private";
export const CAR_TYPES: CarType[] = ["private", "business", "van_no_private"];

// Deduction for business km driven with a private car (onbelaste kilometervergoeding), € per km.
export const KM_RATE = 0.23;

export type Point = { lat: number; lng: number; label: string };

const PDOK = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";

// "3034 RD", "Rakstraat 12 Rotterdam", "Delft" -> a point on the map.
export async function findPlace(q: string): Promise<Point | null> {
  const query = q.trim();
  if (query.length < 2) return null;
  const url = `${PDOK}?q=${encodeURIComponent(query)}&fq=type:(adres OR postcode OR weg OR woonplaats)&rows=1&fl=centroide_ll,weergavenaam`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const doc = (await res.json())?.response?.docs?.[0];
    const point = /POINT\(([\d.]+) ([\d.]+)\)/.exec(doc?.centroide_ll ?? "");
    if (!point) return null;
    return { lng: Number(point[1]), lat: Number(point[2]), label: doc.weergavenaam ?? query };
  } catch {
    return null;
  }
}

function lineKm(a: Point, b: Point) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// One way, by road, rounded to whole km.
export async function roadKm(a: Point, b: Point): Promise<{ km: number; byRoad: boolean }> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { "User-Agent": "Haaks km log" } });
    if (res.ok) {
      const m = (await res.json())?.routes?.[0]?.distance;
      if (typeof m === "number") return { km: Math.max(1, Math.round(m / 1000)), byRoad: true };
    }
  } catch {
    // fall back below
  }
  return { km: Math.max(1, Math.round(lineKm(a, b) * 1.3)), byRoad: false };
}

export const toNum = (v: number | string | null | undefined) => (v === null || v === undefined ? 0 : Number(v) || 0);

export function monthOf(value: string | undefined, today: string) {
  return value && /^\d{4}-\d{2}$/.test(value) ? value : today.slice(0, 7);
}

export function monthBounds(month: string) {
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  return { start: `${month}-01`, next: `${next}-01`, nextMonth: next, prevMonth: prev };
}

// Km driven in a month by the odometer: the last reading on/before the 1st (or the first in the month)
// and the first reading on/after the 1st of the next month (or the last one in the month).
export function odometerKm(readings: OdometerReading[], month: string) {
  const { start, next } = monthBounds(month);
  const sorted = [...readings].sort((a, b) => a.read_on.localeCompare(b.read_on) || a.km - b.km);
  const before = sorted.filter((r) => r.read_on <= start).at(-1) ?? sorted.find((r) => r.read_on >= start && r.read_on < next);
  const after = sorted.find((r) => r.read_on >= next) ?? sorted.filter((r) => r.read_on > start && r.read_on < next).at(-1);
  if (!before || !after || after.km <= before.km || after.id === before.id) return { from: before ?? null, to: after ?? null, km: null };
  return { from: before, to: after, km: after.km - before.km };
}
