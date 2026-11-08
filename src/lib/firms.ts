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
