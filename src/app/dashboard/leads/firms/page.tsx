import Link from "next/link";
import { distanceKm } from "@/lib/feed";
import { getFirmsDict } from "@/lib/firms-i18n";
import { fill } from "@/lib/feed-i18n";
import { loadWorkspace } from "@/lib/workspace";

type Firm = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  lat: number | null;
  lng: number | null;
  maps_url: string | null;
};

const button =
  "rounded-lg border border-purple-300 px-3 py-1.5 text-sm font-semibold text-purple-800";

// «Фирмы рядом»: construction firms near the builder, nearest first.
export default async function FirmsPage() {
  const { supabase, profile, lang } = await loadWorkspace();
  const t = getFirmsDict(lang);
  const home = profile as typeof profile & {
    home_lat?: number | null;
    home_lng?: number | null;
    travel_km?: number | null;
  };
  const me = { lat: home.home_lat ?? null, lng: home.home_lng ?? null };
  const { data } = await supabase
    .from("nearby_firms")
    .select(
      "id, name, address, phone, website, rating, review_count, lat, lng, maps_url",
    )
    .limit(500);
  const radius = home.travel_km || 50;
  const firms = ((data ?? []) as Firm[])
    .map((f) => ({ ...f, km: distanceKm(f, me) }))
    .filter((f) => f.km == null || f.km <= Math.max(radius, 30))
    .sort(
      (a, b) =>
        (a.km ?? 1e9) - (b.km ?? 1e9) ||
        (b.review_count ?? 0) - (a.review_count ?? 0),
    );

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <Link href="/dashboard/leads/feed" className="text-sm text-slate-500">
        {t.back}
      </Link>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          {t.title}
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800">
            {t.test}
          </span>
        </h1>
        <p className="mt-1 text-slate-600">{t.intro}</p>
        {me.lat == null && (
          <p className="mt-2 text-sm text-slate-500">{t.noHome}</p>
        )}
      </div>
      {!firms.length && (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">
          {t.empty}
        </p>
      )}
      <ul className="space-y-3">
        {firms.map((f) => (
          <li
            key={f.id}
            className="rounded-2xl border border-l-4 border-slate-200 border-l-purple-600 bg-white p-4 shadow-sm"
          >
            <p className="font-semibold">{f.name}</p>
            <p className="mt-0.5 text-sm text-slate-600">
              {[
                f.km != null
                  ? `📍 ${fill(t.kmAway, { n: String(Math.round(f.km)) })}`
                  : null,
                f.address,
                f.rating != null
                  ? `★ ${String(f.rating).replace(".", ",")}${f.review_count ? ` (${fill(t.reviews, { n: String(f.review_count) })})` : ""}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {f.website && (
                <a
                  href={f.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={button}
                >
                  {t.site}
                </a>
              )}
              {f.phone && (
                <a
                  href={`tel:${f.phone.replace(/\s/g, "")}`}
                  className={button}
                >
                  📞 {t.call}
                </a>
              )}
              {f.maps_url && (
                <a
                  href={f.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={button}
                >
                  {t.map}
                </a>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-400">{t.source}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
