"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { CAR_TYPES, findPlace, roadKm, type CarType } from "@/lib/trips";
import { homePoint, tripHints, type TripProfile } from "@/lib/trips-server";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f-]{36}$/;
const clean = (s: unknown, max: number) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, max) : "");

async function profileOf(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("city, home_lat, home_lng, trip_home, trip_home_lat, trip_home_lng, current_order_id")
    .eq("id", userId)
    .maybeSingle<TripProfile>();
  return data ?? {};
}

// Km for a trip being typed in: from home (or another address) to an address, one way or return.
export async function estimateTrip(input: { from: string | null; to: string; round: boolean }) {
  const { supabase, user } = await requireUser();
  const from = input.from?.trim() ? await findPlace(input.from) : homePoint(await profileOf(supabase, user.id));
  const to = await findPlace(input.to);
  if (!from || !to) return { ok: false as const, toLabel: to?.label ?? null };
  const { km, byRoad } = await roadKm(from, to);
  return { ok: true as const, km: input.round ? km * 2 : km, byRoad, toLabel: to.label };
}

export async function saveTrip(input: {
  day: string;
  fromLabel: string;
  toLabel: string;
  round: boolean;
  km: number;
  purpose?: string | null;
  orderId?: string | null;
}): Promise<{ ok: boolean }> {
  const { supabase, user } = await requireUser();
  const km = Math.round(Number(input.km) * 10) / 10;
  const toLabel = clean(input.toLabel, 200);
  if (!DAY.test(input.day) || !toLabel || !(km > 0 && km <= 5000)) return { ok: false };
  const { error } = await supabase.from("trips").insert({
    user_id: user.id,
    day: input.day,
    from_label: clean(input.fromLabel, 200) || "Thuis",
    to_label: toLabel,
    round_trip: !!input.round,
    km,
    purpose: clean(input.purpose, 200) || null,
    order_id: input.orderId && UUID.test(input.orderId) ? input.orderId : null,
  });
  if (error) {
    console.error(error);
    return { ok: false };
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function deleteTrip(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("trips").delete().eq("id", id);
  revalidatePath("/dashboard", "layout");
}

// «Да, добавить» on a suggested trip: worked out again on the server, then saved.
export async function acceptTripHint(key: string, purpose: string) {
  const { supabase, user } = await requireUser();
  const profile = await profileOf(supabase, user.id);
  const { data: trips } = await supabase.from("trips").select("day, receipt_id, order_id").eq("user_id", user.id).gte("day", new Date(Date.now() - 10 * 864e5).toISOString().slice(0, 10));
  const hint = (await tripHints(supabase, user.id, profile, trips ?? [])).find((h) => h.key === key);
  if (!hint) return;
  await supabase.from("trips").insert({
    user_id: user.id,
    day: hint.day,
    from_label: homePoint(profile)?.label ?? "Thuis",
    to_label: hint.toLabel,
    round_trip: true,
    km: hint.km,
    purpose: hint.kind === "receipt" ? purpose : hint.who,
    order_id: hint.orderId,
    receipt_id: hint.receiptId,
  });
  revalidatePath("/dashboard", "layout");
}

export async function skipTripHint(key: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("trip_hints_skipped").upsert({ user_id: user.id, hint: key.slice(0, 120) }, { onConflict: "user_id,hint", ignoreDuplicates: true });
  revalidatePath("/dashboard", "layout");
}

export async function saveTripHome(formData: FormData) {
  const { supabase, user } = await requireUser();
  const address = clean(formData.get("address"), 200);
  const place = address ? await findPlace(address) : null;
  await supabase
    .from("profiles")
    .update({ trip_home: place ? place.label : null, trip_home_lat: place?.lat ?? null, trip_home_lng: place?.lng ?? null })
    .eq("id", user.id);
  revalidatePath("/dashboard", "layout");
}

export async function saveCarType(type: string) {
  const { supabase, user } = await requireUser();
  if (!CAR_TYPES.includes(type as CarType)) return;
  await supabase.from("profiles").update({ car_type: type }).eq("id", user.id);
  revalidatePath("/dashboard", "layout");
}

export async function saveOdometer(input: { readOn: string; km: number; photoPath?: string | null }): Promise<{ ok: boolean }> {
  const { supabase, user } = await requireUser();
  const km = Math.round(Number(input.km));
  if (!DAY.test(input.readOn) || !(km >= 0 && km < 10_000_000)) return { ok: false };
  const photo = input.photoPath && input.photoPath.startsWith(`${user.id}/odometer/`) ? input.photoPath : null;
  const { error } = await supabase.from("odometer_readings").insert({ user_id: user.id, read_on: input.readOn, km, photo_path: photo });
  if (error) {
    console.error(error);
    return { ok: false };
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function deleteOdometer(id: string) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("odometer_readings").select("photo_path").eq("id", id).maybeSingle<{ photo_path: string | null }>();
  await supabase.from("odometer_readings").delete().eq("id", id);
  if (data?.photo_path?.startsWith(`${user.id}/odometer/`)) await supabase.storage.from("documents").remove([data.photo_path]);
  revalidatePath("/dashboard", "layout");
}
