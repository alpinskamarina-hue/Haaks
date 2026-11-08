import type { SupabaseClient } from "@supabase/supabase-js";
import type { Offer } from "@/components/FirmOfferState";
import { distanceKm } from "@/lib/feed";

export type Firm = {
  id: string;
  place_id: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  lat: number | null;
  lng: number | null;
  maps_url: string | null;
  email: string | null;
};

type Home = { home_lat?: number | null; home_lng?: number | null; travel_km?: number | null };

// Firms within the builder's travel radius (at least 30 km), nearest first, plus the builder's own offers.
// Without a home city the distance is unknown and every firm is listed (known = false).
export async function loadNearFirms(supabase: SupabaseClient, profile: object) {
  const home = profile as Home;
  const me = { lat: home.home_lat ?? null, lng: home.home_lng ?? null };
  const [{ data }, { data: offerRows }] = await Promise.all([
    supabase
      .from("nearby_firms")
      .select("id, place_id, name, address, phone, website, rating, review_count, lat, lng, maps_url, email")
      .limit(500)
      .returns<Firm[]>(),
    supabase.from("firm_offers").select("firm_id, channel, sent_at, outcome").returns<Offer[]>(),
  ]);
  const radius = Math.max(home.travel_km || 50, 30);
  const firms = (data ?? [])
    .map((f) => ({ ...f, km: distanceKm(f, me) }))
    .filter((f) => f.km == null || f.km <= radius)
    .sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9) || (b.review_count ?? 0) - (a.review_count ?? 0));
  const offers = new Map((offerRows ?? []).map((r) => [r.firm_id, r]));
  return { firms, offers, known: me.lat != null };
}

// Google Maps "search" URL with query_place_id opens the exact place in the app and in the browser;
// the old "place/?q=place_id:…" form makes the Android app search for the id as text.
export function mapsLink(f: { name: string; address: string | null; place_id: string | null }): string {
  const query = encodeURIComponent([f.name, f.address].filter(Boolean).join(", "));
  const id = f.place_id ? `&query_place_id=${encodeURIComponent(f.place_id)}` : "";
  return `https://www.google.com/maps/search/?api=1&query=${query}${id}`;
}
