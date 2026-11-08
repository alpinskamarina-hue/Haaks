import type { Lang } from "@/lib/i18n";

// One job in the order feed, as feed_for_me() returns it to the signed-in worker.
export type FeedItem = {
  id: string;
  source: "telegram" | "bekendmakingen" | "email" | "tenderned" | "haaks" | "facebook" | null;
  source_name: string | null;
  source_url: string | null;
  kind: "private" | "business" | "permit" | "tender";
  title: string | null;
  summary: string | null;
  translations: Partial<Record<Lang, { title?: string; summary?: string }>>;
  trades: string[];
  city: string | null;
  timing: string | null;
  budget: string | null;
  contact: string | null;
  published_at: string;
  is_demo: boolean;
  // Newer than 24 hours for a free worker: only city and trades are known.
  locked: boolean;
  // From feed_places(): where the job is, when known.
  lat?: number | null;
  lng?: number | null;
  region?: string | null;
  // A company job whose company passed Haaks' KvK check.
  kvk_ok?: boolean;
};

export type FeedEmailMode = "off" | "daily" | "instant";

// Dutch trade keys stored on feed items, and words that point to them in the
// free-text "trade" field of a worker's profile (any of the cabinet languages).
const TRADE_WORDS: Record<string, string[]> = {
  tegelzetter: ["tegel", "tile", "tiling", "плит", "кафел", "плитк", "glazur", "płyt", "plytk", "faian", "gresie", "fayans", "seramik"],
  timmerman: ["timmer", "carpent", "joiner", "плотн", "столяр", "тесл", "cieśl", "ciesl", "stolarz", "tâmplar", "tamplar", "dulgher", "laminat", "ламинат", "ламінат", "vloer", "marangoz", "doğrama"],
  stukadoor: ["stuka", "plaster", "штукат", "tynk", "ipsos", "tencuial", "sıva", "alçı"],
  schilder: ["schilder", "painter", "маляр", "malarz", "zugrav", "zugrăv", "vopsit", "boya"],
  loodgieter: ["loodgiet", "plumb", "сантех", "hydraulik", "instalator", "instalat", "tesisat", "sıhhi"],
  elektricien: ["elektric", "electric", "электр", "електр", "elektryk", "elektrik"],
  metselaar: ["metsel", "mason", "brick", "камен", "кладк", "мурар", "murarz", "zidar", "duvar", "tuğla"],
  dakdekker: ["dakdek", "roof", "кровел", "покрів", "dekarz", "acoperi", "çatı"],
  aannemer: ["aannemer", "contractor", "подряд", "підряд", "budowlan", "construct", "строит", "будів", "müteahhit", "inşaat"],
  klusjesman: ["klus", "handyman", "мастер на все", "złota rączka", "zlota raczka", "tamir"],
};

export const TRADE_LABELS: Record<string, Partial<Record<Lang, string>>> = {
  tegelzetter: { en: "tiler", ru: "плиточник", uk: "плиточник", pl: "glazurnik", ro: "faianțar", tr: "fayansçı", nl: "tegelzetter" },
  timmerman: { en: "carpenter", ru: "плотник", uk: "тесляр", pl: "cieśla", ro: "tâmplar", tr: "marangoz", nl: "timmerman" },
  stukadoor: { en: "plasterer", ru: "штукатур", uk: "штукатур", pl: "tynkarz", ro: "tencuitor", tr: "sıvacı", nl: "stukadoor" },
  schilder: { en: "painter", ru: "маляр", uk: "маляр", pl: "malarz", ro: "zugrav", tr: "boyacı", nl: "schilder" },
  loodgieter: { en: "plumber", ru: "сантехник", uk: "сантехнік", pl: "hydraulik", ro: "instalator", tr: "tesisatçı", nl: "loodgieter" },
  elektricien: { en: "electrician", ru: "электрик", uk: "електрик", pl: "elektryk", ro: "electrician", tr: "elektrikçi", nl: "elektricien" },
  metselaar: { en: "bricklayer", ru: "каменщик", uk: "муляр", pl: "murarz", ro: "zidar", tr: "duvarcı", nl: "metselaar" },
  dakdekker: { en: "roofer", ru: "кровельщик", uk: "покрівельник", pl: "dekarz", ro: "acoperișar", tr: "çatı ustası", nl: "dakdekker" },
  aannemer: { en: "contractor", ru: "подрядчик", uk: "підрядник", pl: "wykonawca", ro: "antreprenor", tr: "müteahhit", nl: "aannemer" },
  klusjesman: { en: "handyman", ru: "мастер", uk: "майстер", pl: "złota rączka", ro: "meșter", tr: "tamirci", nl: "klusjesman" },
};

export function tradeLabel(key: string, lang: Lang) {
  return TRADE_LABELS[key]?.[lang] ?? TRADE_LABELS[key]?.en ?? key;
}

// Trade keys a worker's free-text trade points to, e.g. "Tegelzetter" or "плиточник" -> ["tegelzetter"].
export function workerTrades(trade: string | null | undefined) {
  const text = (trade ?? "").toLowerCase();
  if (!text.trim()) return [];
  return Object.entries(TRADE_WORDS)
    .filter(([key, words]) => text.includes(key) || words.some((w) => text.includes(w)))
    .map(([key]) => key);
}

export function workerRegions(regions: string | null | undefined) {
  return (regions ?? "")
    .split(/[,;\n]/)
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);
}

// Trade ids of the worker profile (worker-profile.ts) -> Dutch trade keys of feed items.
const PROFILE_TRADES: Record<string, string[]> = {
  tiler: ["tegelzetter"],
  plumber: ["loodgieter"],
  carpenter: ["timmerman"],
  electrician: ["elektricien"],
  painter: ["schilder"],
  bricklayer: ["metselaar"],
  drywall: ["stukadoor", "timmerman"],
  plasterer: ["stukadoor"],
  roofer: ["dakdekker"],
  windows_doors: ["timmerman"],
  flooring: ["timmerman", "tegelzetter"],
  welder: ["aannemer"],
  labourer: ["klusjesman", "aannemer"],
  other: [],
};

// What the feed matches a worker on: trades, home point and travel radius, extra cities.
export type WorkerMatch = {
  trades: string[];
  regions: string[];
  lat: number | null;
  lng: number | null;
  // km; 0 = the whole country, null = not set (the home city counts then).
  radius: number | null;
};

type MatchProfile = {
  trade?: string | null;
  trades?: string[] | null;
  city?: string | null;
  lead_regions?: string | null;
  home_lat?: number | null;
  home_lng?: number | null;
  travel_km?: number | null;
  extra_cities?: string[] | null;
};

export function workerMatch(p: MatchProfile | null | undefined): WorkerMatch {
  const trades = new Set([...(p?.trades ?? []).flatMap((id) => PROFILE_TRADES[id] ?? []), ...workerTrades(p?.trade)]);
  const regions = new Set([...workerRegions(p?.lead_regions ?? p?.city), ...workerRegions(p?.city), ...(p?.extra_cities ?? []).map((c) => c.trim().toLowerCase())]);
  return {
    trades: [...trades],
    regions: [...regions].filter(Boolean),
    lat: p?.home_lat ?? null,
    lng: p?.home_lng ?? null,
    radius: p?.travel_km ?? null,
  };
}

type Placed = { lat?: number | null; lng?: number | null };

// Straight-line distance in km between the worker's home and the job, or null if either is unknown.
export function distanceKm(item: Placed, m: Pick<WorkerMatch, "lat" | "lng">) {
  if (item.lat == null || item.lng == null || m.lat == null || m.lng == null) return null;
  const rad = Math.PI / 180;
  const dLat = (item.lat - m.lat) * rad;
  const dLng = (item.lng - m.lng) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(m.lat * rad) * Math.cos(item.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

function inRegion(item: Pick<FeedItem, "city"> & Placed & { region?: string | null }, m: WorkerMatch) {
  if (m.radius === 0) return 1;
  const places = [item.city, item.region].map((c) => (c ?? "").toLowerCase()).filter(Boolean);
  if (places.some((c) => m.regions.some((r) => c.includes(r) || r.includes(c)))) return 1;
  const km = distanceKm(item, m);
  if (km !== null) return km <= (m.radius ?? 30) ? 1 : 0;
  return m.regions.length === 0 && m.lat == null ? 0.5 : 0;
}

// 0-100: trade counts most, then the place (within the travel radius or in one of the cities).
export function feedScore(item: Pick<FeedItem, "trades" | "city"> & Placed & { region?: string | null }, m: WorkerMatch) {
  const tradeFit = m.trades.length === 0 ? 0.5 : item.trades.some((t) => m.trades.includes(t)) ? 1 : 0;
  return Math.round(tradeFit * 60 + inRegion(item, m) * 35 + 5);
}

export function feedText(item: FeedItem, lang: Lang) {
  const local = item.translations[lang];
  return {
    title: local?.title || item.title || "",
    summary: local?.summary || item.summary || "",
  };
}

export function sourceLabel(item: Pick<FeedItem, "source" | "source_name">) {
  const base: Record<NonNullable<FeedItem["source"]>, string> = {
    telegram: "Telegram",
    bekendmakingen: "Omgevingsvergunning",
    email: "E-mail",
    tenderned: "TenderNed",
    haaks: "Haaks",
    facebook: "Facebook",
  };
  if (!item.source) return "";
  const name = item.source_name;
  if (!name || name === base[item.source]) return base[item.source];
  return item.source === "bekendmakingen" || item.source === "tenderned" ? name : `${base[item.source]} · ${name}`;
}

export function timeAgo(iso: string, lang: Lang) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.round(hours / 24), "day");
}
