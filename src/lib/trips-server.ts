import type { requireUser } from "@/lib/auth";
import { addDays, dutchToday } from "@/lib/quotes";
import { findPlace, roadKm, type Point, type Trip } from "@/lib/trips";

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

export type TripProfile = {
  city?: string | null;
  home_lat?: number | null;
  home_lng?: number | null;
  trip_home?: string | null;
  trip_home_lat?: number | null;
  trip_home_lng?: number | null;
  current_order_id?: string | null;
};

// Where trips start: the address set on the trips page, else the home city from the profile.
export function homePoint(p: TripProfile): Point | null {
  if (p.trip_home_lat != null && p.trip_home_lng != null) return { lat: p.trip_home_lat, lng: p.trip_home_lng, label: p.trip_home || "Thuis" };
  if (p.home_lat != null && p.home_lng != null) return { lat: p.home_lat, lng: p.home_lng, label: p.city || "Thuis" };
  return null;
}

export type TripHint = {
  key: string;
  day: string;
  kind: "order" | "receipt";
  who: string;
  toLabel: string;
  km: number;
  orderId: string | null;
  receiptId: string | null;
  query: string;
};

// Trips the app offers to add with one tap: the order in work (yesterday or today) and recent
// shop receipts. Answered «Не ездил» once, a hint is not offered again.
export async function tripHints(supabase: Supabase, userId: string, profile: TripProfile, trips: Pick<Trip, "day" | "receipt_id" | "order_id">[]) {
  const home = homePoint(profile);
  if (!home) return [];
  const today = dutchToday();
  const yesterday = addDays(-1);
  const days = new Set(trips.map((t) => t.day));
  const usedReceipts = new Set(trips.map((t) => t.receipt_id).filter(Boolean));
  const [{ data: skipped }, { data: order }, { data: receipts }] = await Promise.all([
    supabase.from("trip_hints_skipped").select("hint").eq("user_id", userId),
    profile.current_order_id
      ? supabase.from("orders").select("id, client_name, title, address, status").eq("id", profile.current_order_id).maybeSingle<{ id: string; client_name: string | null; title: string; address: string | null; status: string }>()
      : Promise.resolve({ data: null }),
    supabase
      .from("receipts")
      .select("id, store_name, store_city, purchased_on")
      .eq("user_id", userId)
      .gte("purchased_on", addDays(-7))
      .not("store_city", "is", null)
      .order("purchased_on", { ascending: false })
      .limit(5)
      .returns<{ id: string; store_name: string | null; store_city: string | null; purchased_on: string }[]>(),
  ]);
  const skip = new Set((skipped ?? []).map((s: { hint: string }) => s.hint));
  const wanted: Omit<TripHint, "km">[] = [];

  if (order && order.status === "open" && order.address?.trim()) {
    const day = !days.has(yesterday) ? yesterday : !days.has(today) ? today : null;
    if (day) {
      wanted.push({ key: `order:${order.id}:${day}`, day, kind: "order", who: order.client_name || order.title, toLabel: order.address.trim(), orderId: order.id, receiptId: null, query: order.address.trim() });
    }
  }
  for (const r of receipts ?? []) {
    if (usedReceipts.has(r.id) || !r.store_city) continue;
    wanted.push({
      key: `receipt:${r.id}`,
      day: r.purchased_on,
      kind: "receipt",
      who: r.store_name || r.store_city,
      toLabel: [r.store_name, r.store_city].filter(Boolean).join(" "),
      orderId: null,
      receiptId: r.id,
      query: r.store_city,
    });
  }

  const open = wanted.filter((h) => !skip.has(h.key)).slice(0, 3);
  const out: TripHint[] = [];
  for (const h of open) {
    const place = await findPlace(h.query);
    if (!place) continue;
    const { km } = await roadKm(home, place);
    out.push({ ...h, km: km * 2 });
  }
  return out;
}
